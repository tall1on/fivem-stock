import * as fs from 'fs/promises';
import * as path from 'path';
import { getDeterministicRandom } from '../utils/random';
import * as dotenv from 'dotenv';

// Load environment variables from .env file in the server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const CACHE_DIR = path.join(__dirname, '../../runtime/cache/stocks');
const GLOBAL_SEED = process.env.STOCK_SEED || 'default_seed';
const START_DATE_STR = process.env.STOCK_START_DATE || '2026-04-25T00:00:00Z';
const START_DATE = new Date(START_DATE_STR);

export interface PricePoint {
  hourIndex: number;
  timestamp: string;
  price: number;
}

interface StockCache {
  ticker: string;
  lastCalculatedHour: number;
  history: Record<number, number>;
}

export class StockService {
  private static instance: StockService;

  private constructor() {}

  public static getInstance(): StockService {
    if (!StockService.instance) {
      StockService.instance = new StockService();
    }
    return StockService.instance;
  }

  /**
   * Generates a base price for a stock based on its ticker.
   * Range: 50.00 to 500.00
   */
  private getBasePrice(ticker: string): number {
    const r = getDeterministicRandom(ticker + ":base_price");
    return Number((50 + (r * 450)).toFixed(2));
  }

  /**
   * Calculates the number of hours elapsed since the start date.
   */
  public getCurrentHourIndex(): number {
    const now = new Date();
    const diffMs = now.getTime() - START_DATE.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  }

  /**
   * Returns the ISO timestamp for a given hour index.
   */
  private getTimestampForHour(hourIndex: number): string {
    const date = new Date(START_DATE.getTime() + hourIndex * 1000 * 60 * 60);
    return date.toISOString();
  }

  /**
   * Loads the cached price data for a stock.
   */
  private async loadCache(ticker: string): Promise<StockCache> {
    const filePath = path.join(CACHE_DIR, `${ticker}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return {
        ticker,
        lastCalculatedHour: -1,
        history: {}
      };
    }
  }

  /**
   * Saves the price data for a stock to the cache.
   */
  private async saveCache(cache: StockCache): Promise<void> {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const filePath = path.join(CACHE_DIR, `${cache.ticker}.json`);
    await fs.writeFile(filePath, JSON.stringify(cache, null, 2));
  }

  /**
   * Ensures that all prices up to the target hour are calculated and cached.
   */
  private async ensurePricesCalculated(ticker: string, targetHour: number): Promise<StockCache> {
    const cache = await this.loadCache(ticker);

    if (targetHour <= cache.lastCalculatedHour) {
      return cache;
    }

    let currentPrice: number;
    let startHour: number;

    if (cache.lastCalculatedHour === -1) {
      currentPrice = this.getBasePrice(ticker);
      cache.history[0] = currentPrice;
      startHour = 1;
    } else {
      currentPrice = cache.history[cache.lastCalculatedHour];
      startHour = cache.lastCalculatedHour + 1;
    }

    for (let h = startHour; h <= targetHour; h++) {
      const hourSeed = `${GLOBAL_SEED}:${ticker}:${h}`;
      
      // Magnitude: 0.1% to 0.5%
      const r1 = getDeterministicRandom(hourSeed + ":magnitude");
      const magnitude = 0.001 + (r1 * 0.004);
      
      // Direction: Up or Down
      const r2 = getDeterministicRandom(hourSeed + ":direction");
      const direction = r2 > 0.5 ? 1 : -1;
      
      const change = magnitude * direction;
      currentPrice = currentPrice * (1 + change);
      cache.history[h] = Number(currentPrice.toFixed(2));
    }

    cache.lastCalculatedHour = targetHour;
    await this.saveCache(cache);
    return cache;
  }

  /**
   * Returns the current price of a stock.
   */
  public async getCurrentPrice(ticker: string): Promise<number> {
    const currentHour = this.getCurrentHourIndex();
    const cache = await this.ensurePricesCalculated(ticker, currentHour);
    return cache.history[currentHour];
  }

  /**
   * Returns a range of historical prices for a stock based on a named range.
   * Supported ranges: 1d, 5d, 1m, ytd, 1y, 5y, max
   */
  public async getHistoryRange(ticker: string, range: string): Promise<PricePoint[]> {
    const currentHour = this.getCurrentHourIndex();
    let fromHour = 0;
    let step = 1;

    const now = new Date();

    switch (range.toLowerCase()) {
      case '1d':
        fromHour = currentHour - 24;
        step = 1;
        break;
      case '5d':
        fromHour = currentHour - 120;
        step = 1;
        break;
      case '1m':
        fromHour = currentHour - (24 * 30);
        step = 4; // Every 4 hours
        break;
      case 'ytd':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const diffMs = startOfYear.getTime() - START_DATE.getTime();
        fromHour = Math.floor(diffMs / (1000 * 60 * 60));
        step = 24; // Daily
        break;
      case '1y':
        fromHour = currentHour - (24 * 365);
        step = 24; // Daily
        break;
      case '5y':
        fromHour = currentHour - (24 * 365 * 5);
        step = 24 * 7; // Weekly
        break;
      case 'max':
        fromHour = 0;
        // Dynamic step based on total hours
        if (currentHour > 24 * 365 * 2) {
          step = 24 * 7; // Weekly if > 2 years
        } else if (currentHour > 24 * 30 * 6) {
          step = 24; // Daily if > 6 months
        } else {
          step = 4;
        }
        break;
      default:
        fromHour = currentHour - 24;
        step = 1;
    }

    fromHour = Math.max(0, fromHour);

    // Ensure prices are calculated up to currentHour
    const cache = await this.ensurePricesCalculated(ticker, currentHour);

    const history: PricePoint[] = [];
    for (let h = fromHour; h <= currentHour; h += step) {
      if (cache.history[h] !== undefined) {
        history.push({
          hourIndex: h,
          timestamp: this.getTimestampForHour(h),
          price: cache.history[h]
        });
      }
    }

    // Always ensure the latest price is included
    if (history.length > 0 && history[history.length - 1].hourIndex !== currentHour) {
      history.push({
        hourIndex: currentHour,
        timestamp: this.getTimestampForHour(currentHour),
        price: cache.history[currentHour]
      });
    } else if (history.length === 0 && cache.history[currentHour] !== undefined) {
      history.push({
        hourIndex: currentHour,
        timestamp: this.getTimestampForHour(currentHour),
        price: cache.history[currentHour]
      });
    }

    return history;
  }

  /**
   * Returns a range of historical prices for a stock.
   */
  public async getPriceHistory(ticker: string, fromHour: number, toHour: number): Promise<PricePoint[]> {
    const currentHour = this.getCurrentHourIndex();
    const actualToHour = Math.min(toHour, currentHour);
    const cache = await this.ensurePricesCalculated(ticker, actualToHour);

    const history: PricePoint[] = [];
    for (let h = fromHour; h <= actualToHour; h++) {
      if (cache.history[h] !== undefined) {
        history.push({
          hourIndex: h,
          timestamp: this.getTimestampForHour(h),
          price: cache.history[h]
        });
      }
    }
    return history;
  }
}
