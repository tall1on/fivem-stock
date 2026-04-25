<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useStockStore, type Company, type HistoryRange } from '../stores/stockStore';
import { useWebSocket } from '../composables/useWebSocket';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { ArrowLeft, TrendingUp, TrendingDown, Info, Clock, BarChart3 } from 'lucide-vue-next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps<{
  company: Company;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const store = useStockStore();
const { getHistory } = useWebSocket();

const activeRange = ref<HistoryRange>('1d');
const ranges: { label: string; value: HistoryRange }[] = [
  { label: '1D', value: '1d' },
  { label: '5D', value: '5d' },
  { label: '1M', value: '1m' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
  { label: 'MAX', value: 'max' },
];

const ticker = computed(() => props.company.ticker[0]);
const historyData = computed(() => store.history[ticker.value]?.[activeRange.value] || []);

const currentPrice = computed(() => store.prices[ticker.value] || props.company.price || 0);
const dayStartPrice = computed(() => store.dayStartPrices[ticker.value] || props.company.price || 0);
const change = computed(() => currentPrice.value - dayStartPrice.value);
const changePercent = computed(() => dayStartPrice.value !== 0 ? (change.value / dayStartPrice.value) * 100 : 0);
const isPositive = computed(() => change.value >= 0);

const fetchHistory = () => {
  getHistory(ticker.value, activeRange.value);
};

onMounted(() => {
  fetchHistory();
});

watch(activeRange, () => {
  fetchHistory();
});

const chartData = computed<ChartData<'line'>>(() => {
  const data = historyData.value;
  return {
    labels: data.map(p => {
      const date = new Date(p.timestamp);
      if (activeRange.value === '1d' || activeRange.value === '5d') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: activeRange.value.includes('y') || activeRange.value === 'max' ? '2-digit' : undefined });
    }),
    datasets: [
      {
        label: 'Price',
        data: data.map(p => p.price),
        borderColor: isPositive.value ? '#10b981' : '#ef4444',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, isPositive.value ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };
});

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#f8fafc',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context) => {
          const value = context.parsed.y;
          if (value === null || value === undefined) return '';
          return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }
    },
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: false,
      },
      ticks: {
        color: '#94a3b8',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
      },
    },
    y: {
      display: true,
      position: 'right',
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
      },
      ticks: {
        color: '#94a3b8',
        callback: (value) => `$${value}`,
      },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
}));

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};
</script>

<template>
  <div class="stock-detail-container fade-in-up">
    <!-- Back Button & Header -->
    <div class="detail-header">
      <button @click="emit('back')" class="back-btn">
        <ArrowLeft class="w-5 h-5" />
        <span>Back to Market</span>
      </button>
      
      <div class="company-info-main">
        <div class="flex items-center gap-4">
          <div class="company-logo-large" v-if="company.logoUrl">
            <img :src="company.logoUrl" :alt="company.name" />
          </div>
          <div class="company-logo-large placeholder" v-else>
            {{ company.name.charAt(0) }}
          </div>
          <div>
            <h1 class="company-name-title">{{ company.name }}</h1>
            <div class="flex items-center gap-2">
              <span class="ticker-badge">{{ ticker }}</span>
              <span class="exchange-label">BAWSAQ Listed</span>
            </div>
          </div>
        </div>
        
        <div class="price-display-large">
          <div class="current-price-large">{{ formatCurrency(currentPrice) }}</div>
          <div :class="['price-change-large', isPositive ? 'positive' : 'negative']">
            <component :is="isPositive ? TrendingUp : TrendingDown" class="w-5 h-5" />
            <span>{{ isPositive ? '+' : '' }}{{ formatCurrency(change) }} ({{ isPositive ? '+' : '' }}{{ changePercent.toFixed(2) }}%)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="detail-grid">
      <!-- Chart Section -->
      <div class="chart-section card">
        <div class="chart-header">
          <div class="flex items-center gap-2 text-dark-400">
            <BarChart3 class="w-4 h-4" />
            <span class="text-sm font-medium uppercase tracking-wider">Price History</span>
          </div>
          <div class="range-selector">
            <button
              v-for="range in ranges"
              :key="range.value"
              @click="activeRange = range.value"
              :class="['range-btn', { active: activeRange === range.value }]"
            >
              {{ range.label }}
            </button>
          </div>
        </div>
        
        <div class="chart-container">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Sidebar Info -->
      <div class="info-sidebar">
        <!-- Stats Card -->
        <div class="stats-card card">
          <h3 class="card-title">Market Stats</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Open</span>
              <span class="stat-value">{{ formatCurrency(dayStartPrice) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Volume</span>
              <span class="stat-value">{{ company.volume?.toLocaleString() || '1.2M' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Market Cap</span>
              <span class="stat-value">$4.2B</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">P/E Ratio</span>
              <span class="stat-value">24.5</span>
            </div>
          </div>
        </div>

        <!-- About Card -->
        <div class="about-card card">
          <div class="flex items-center gap-2 mb-4">
            <Info class="w-5 h-5 text-blue-400" />
            <h3 class="card-title mb-0">About {{ company.name }}</h3>
          </div>
          <p class="company-description">
            {{ company.description || `${company.name} is a leading company in the San Andreas region, providing innovative solutions and services to the citizens of Los Santos and beyond.` }}
          </p>
          <div class="mt-6 pt-6 border-t border-white/5">
            <div class="flex items-center gap-2 text-dark-400 text-sm">
              <Clock class="w-4 h-4" />
              <span>Last updated: Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables.scss';

.stock-detail-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 3rem 2rem;
  }
}

.detail-header {
  margin-bottom: 2.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: $dark-400;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  transition: all 0.2s;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0;

  &:hover {
    color: $dark-50;
    transform: translateX(-4px);
  }
}

.company-info-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.company-logo-large {
  width: 64px;
  height: 64px;
  border-radius: $radius-xl;
  background: $dark-800;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  &.placeholder {
    font-size: 1.5rem;
    font-weight: 700;
    color: $primary-500;
  }
}

.company-name-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: $dark-50;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.ticker-badge {
  background: rgba($primary-500, 0.1);
  color: $primary-500;
  padding: 0.125rem 0.5rem;
  border-radius: $radius-md;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.exchange-label {
  color: $dark-400;
  font-size: 0.75rem;
  font-weight: 500;
}

.price-display-large {
  text-align: left;
  
  @media (min-width: 768px) {
    text-align: right;
  }
}

.current-price-large {
  font-size: 2.5rem;
  font-weight: 800;
  color: $dark-50;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.price-change-large {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 1.125rem;
  font-weight: 600;
  
  @media (min-width: 768px) {
    justify-content: flex-end;
  }
  
  &.positive { color: $success-500; }
  &.negative { color: $danger-500; }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 350px;
  }
}

.card {
  background: rgba($dark-800, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: $radius-2xl;
  padding: 1.5rem;
}

.chart-section {
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.chart-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.range-selector {
  display: flex;
  background: $dark-900;
  padding: 0.25rem;
  border-radius: $radius-xl;
  gap: 0.125rem;
}

.range-btn {
  padding: 0.375rem 0.875rem;
  border-radius: $radius-lg;
  font-size: 0.75rem;
  font-weight: 700;
  color: $dark-400;
  transition: all 0.2s;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: $dark-50;
    background: rgba(255, 255, 255, 0.05);
  }

  &.active {
    background: $primary-600;
    color: white;
    box-shadow: 0 4px 12px rgba($primary-600, 0.3);
  }
}

.chart-container {
  flex: 1;
  position: relative;
  min-height: 350px;
}

.info-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: $dark-50;
  margin-bottom: 1.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: $dark-400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: $dark-100;
}

.company-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: $dark-300;
}
</style>