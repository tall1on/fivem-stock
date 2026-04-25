import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';
import { StockService, PricePoint } from './services/StockService';

// Declare Bun for TypeScript since we are running in Bun environment
declare var Bun: any;

export type HistoryRange = '1d' | '5d' | '1m' | 'ytd' | '1y' | '5y' | 'max';

export interface IncomingMessage {
  type: 'subscribe' | 'unsubscribe' | 'get_stock' | 'get_history';
  ticker?: string;
  fromHour?: number;
  toHour?: number;
  range?: HistoryRange;
}

export interface OutgoingMessage {
  type: 'stock_update' | 'history_data' | 'error';
  ticker?: string;
  price?: number;
  dayStartPrice?: number;
  hourIndex?: number;
  history?: PricePoint[];
  range?: HistoryRange;
  message?: string;
}

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.API_KEY;
const PORT = 3000;

if (!API_KEY) {
  console.error('API_KEY not found in environment variables');
  process.exit(1);
}

const stockService = StockService.getInstance();

// Load all tickers from companies.json for broadcasting
let allTickers: string[] = [];
async function loadTickers() {
  try {
    const companiesPath = path.join(__dirname, '../../client/public/companies.json');
    const companiesData = await fs.readFile(companiesPath, 'utf-8');
    const companies = JSON.parse(companiesData);
    allTickers = companies.flatMap((c: any) => c.ticker);
    console.log(`Loaded ${allTickers.length} tickers for broadcasting.`);
  } catch (error) {
    console.error('Failed to load tickers from companies.json:', error);
  }
}

await loadTickers();

let lastHourIndex = stockService.getCurrentHourIndex();

const server = Bun.serve({
  port: PORT,
  fetch(req: any, server: any) {
    const url = new URL(req.url);
    const apiKey = url.searchParams.get('apiKey') || req.headers.get('X-API-Key');

    if (apiKey !== API_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (server.upgrade(req)) {
      return; // upgrade successful
    }

    return new Response('Upgrade failed', { status: 500 });
  },
  websocket: {
    async message(ws: any, message: any) {
      try {
        const data = JSON.parse(message.toString()) as IncomingMessage;
        const { type, ticker, fromHour, toHour, range } = data;

        switch (type) {
          case 'subscribe':
            if (ticker) {
              ws.subscribe(`stock:${ticker}`);
              // Send current price immediately upon subscription
              const currentHourIndex = stockService.getCurrentHourIndex();
              const dayStartHourIndex = Math.floor(currentHourIndex / 24) * 24;
              const [price, dayStartPrice] = await Promise.all([
                stockService.getCurrentPrice(ticker),
                stockService.getPriceAtHour(ticker, dayStartHourIndex)
              ]);
              
              ws.send(JSON.stringify({
                type: 'stock_update',
                ticker,
                price,
                dayStartPrice,
                hourIndex: currentHourIndex
              } as OutgoingMessage));
            }
            break;
          case 'unsubscribe':
            if (ticker) {
              ws.unsubscribe(`stock:${ticker}`);
            }
            break;
          case 'get_stock':
            if (ticker) {
              const currentHourIndex = stockService.getCurrentHourIndex();
              const dayStartHourIndex = Math.floor(currentHourIndex / 24) * 24;
              const [price, dayStartPrice] = await Promise.all([
                stockService.getCurrentPrice(ticker),
                stockService.getPriceAtHour(ticker, dayStartHourIndex)
              ]);

              ws.send(JSON.stringify({
                type: 'stock_update',
                ticker,
                price,
                dayStartPrice,
                hourIndex: currentHourIndex
              } as OutgoingMessage));
            }
            break;
          case 'get_history':
            if (ticker) {
              let history: PricePoint[] = [];
              if (range) {
                history = await stockService.getHistoryRange(ticker, range);
              } else if (fromHour !== undefined && toHour !== undefined) {
                history = await stockService.getPriceHistory(ticker, fromHour, toHour);
              }

              ws.send(JSON.stringify({
                type: 'history_data',
                ticker,
                history,
                range
              } as OutgoingMessage));
            }
            break;
          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' } as OutgoingMessage));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format or server error' } as OutgoingMessage));
      }
    },
    open(ws: any) {
      // Connection opened
    },
    close(ws: any) {
      // Connection closed
    }
  }
});

console.log(`Stock WebSocket server running on port ${PORT}`);

// Real-time updates timer (every 30 seconds)
setInterval(async () => {
  const currentHourIndex = stockService.getCurrentHourIndex();
  if (currentHourIndex !== lastHourIndex) {
    console.log(`Hour changed from ${lastHourIndex} to ${currentHourIndex}. Broadcasting updates...`);
    lastHourIndex = currentHourIndex;
    const dayStartHourIndex = Math.floor(currentHourIndex / 24) * 24;
    
    for (const ticker of allTickers) {
      try {
        const [price, dayStartPrice] = await Promise.all([
          stockService.getCurrentPrice(ticker),
          stockService.getPriceAtHour(ticker, dayStartHourIndex)
        ]);

        server.publish(`stock:${ticker}`, JSON.stringify({
          type: 'stock_update',
          ticker,
          price,
          dayStartPrice,
          hourIndex: currentHourIndex
        }));
      } catch (error) {
        console.error(`Failed to broadcast update for ${ticker}:`, error);
      }
    }
  }
}, 30000);
