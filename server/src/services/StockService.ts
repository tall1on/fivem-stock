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
