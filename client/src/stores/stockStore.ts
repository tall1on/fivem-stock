import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface PricePoint {
  hourIndex: number;
  timestamp: string;
  price: number;
}

export interface Company {
  name: string;
  ticker: string[];
  logo?: string;
  logoUrl?: string;
  description?: string | null;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
}

export const useStockStore = defineStore('stock', () => {
  const companies = ref<Company[]>([]);
  const prices = ref<Record<string, number>>({});
  const previousPrices = ref<Record<string, number>>({});
  const dayStartPrices = ref<Record<string, number>>({});
  const history = ref<Record<string, PricePoint[]>>({});
  const isConnected = ref(false);

  /**
   * Initializes the companies list.
   */
  function setCompanies(newCompanies: Company[]) {
    companies.value = newCompanies.map(company => ({
      ...company,
      price: prices.value[company.ticker[0]] || 0,
      change: 0,
      changePercent: 0
    }));
  }

  /**
   * Updates the price for a specific ticker.
   * Also updates the corresponding company object.
   */
  function updateStockPrice(ticker: string, price: number, dayStartPrice?: number) {
    if (prices.value[ticker] !== undefined) {
      previousPrices.value[ticker] = prices.value[ticker];
    } else {
      // If we don't have a previous price, use the current one to avoid huge jumps
      previousPrices.value[ticker] = price;
    }

    if (dayStartPrice !== undefined) {
      dayStartPrices.value[ticker] = dayStartPrice;
    } else if (dayStartPrices.value[ticker] === undefined) {
      dayStartPrices.value[ticker] = price;
    }
    
    prices.value[ticker] = price;

    // Update company object in the list
    const company = companies.value.find(c => c.ticker.includes(ticker));
    if (company) {
      const referencePrice = dayStartPrices.value[ticker] ?? previousPrices.value[ticker];
      company.price = price;
      company.change = price - referencePrice;
      company.changePercent = referencePrice !== 0 ? ((price - referencePrice) / referencePrice) * 100 : 0;
    }
  }

  /**
   * Sets the history data for a specific ticker.
   */
  function setHistory(ticker: string, data: PricePoint[]) {
    history.value[ticker] = data;
  }

  /**
   * Updates the connection status.
   */
  function setConnectionStatus(status: boolean) {
    isConnected.value = status;
  }

  return {
    companies,
    prices,
    previousPrices,
    dayStartPrices,
    history,
    isConnected,
    setCompanies,
    updateStockPrice,
    setHistory,
    setConnectionStatus
  };
});
