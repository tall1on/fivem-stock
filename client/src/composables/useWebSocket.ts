import { ref, onUnmounted } from 'vue';
import { useStockStore } from '../stores/stockStore';
import { getApiKey } from '../utils/auth';

export type HistoryRange = '1d' | '5d' | '1m' | 'ytd' | '1y' | '5y' | 'max';

const socket = ref<WebSocket | null>(null);
const reconnectTimeout = ref<number | null>(null);

/**
 * Composable for managing WebSocket connection and communication.
 */
export function useWebSocket() {
  const store = useStockStore();

  /**
   * Establishes a WebSocket connection.
   */
  const connect = () => {
    if (socket.value?.readyState === WebSocket.OPEN) return;

    const apiKey = getApiKey();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Use environment variable if provided, otherwise default to localhost:3000 or current host
    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
      wsUrl = `${protocol}//${host}`;
    }
    
    // Ensure the URL has a protocol for the URL constructor
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      wsUrl = `${protocol}//${wsUrl.replace(/^https?:\/\//, '')}`;
    }

    const url = new URL(wsUrl);
    url.searchParams.set('apiKey', apiKey);

    socket.value = new WebSocket(url.toString());

    socket.value.onopen = () => {
      console.log('WebSocket connected');
      store.setConnectionStatus(true);
      if (reconnectTimeout.value) {
        clearTimeout(reconnectTimeout.value);
        reconnectTimeout.value = null;
      }
    };

    socket.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'stock_update':
            if (data.ticker && data.price !== undefined) {
              store.updateStockPrice(data.ticker, data.price, data.dayStartPrice);
            }
            break;
          case 'history_data':
            if (data.ticker && data.history) {
              store.setHistory(data.ticker, data.history, data.range || '1d');
            }
            break;
          case 'error':
            console.error('WebSocket error message:', data.message);
            break;
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    socket.value.onclose = () => {
      console.log('WebSocket disconnected');
      store.setConnectionStatus(false);
      // Reconnect after 5 seconds
      if (!reconnectTimeout.value) {
        reconnectTimeout.value = window.setTimeout(connect, 5000);
      }
    };

    socket.value.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  /**
   * Subscribes to updates for a specific ticker.
   */
  const subscribe = (ticker: string) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({ type: 'subscribe', ticker }));
    }
  };

  /**
   * Unsubscribes from updates for a specific ticker.
   */
  const unsubscribe = (ticker: string) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({ type: 'unsubscribe', ticker }));
    }
  };

  /**
   * Requests history data for a specific ticker and range.
   */
  const getHistory = (ticker: string, range: HistoryRange = '1d') => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({ type: 'get_history', ticker, range }));
    }
  };

  /**
   * Closes the WebSocket connection.
   */
  const disconnect = () => {
    if (reconnectTimeout.value) {
      clearTimeout(reconnectTimeout.value);
      reconnectTimeout.value = null;
    }
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
  };

  onUnmounted(() => {
    // Don't disconnect the shared socket when a component unmounts
    // The socket is shared across all component instances
  });

  return {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    getHistory
  };
}
