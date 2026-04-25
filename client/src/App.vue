<template>
  <div id="app" class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-brand">
          <div class="header-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="hidden sm:block">
            <h1 class="header-title">FiveM Stock</h1>
            <p class="header-subtitle">Virtual Stock Exchange</p>
          </div>
        </div>

        <div class="header-search flex-1 max-w-2xl mx-4">
          <SearchBar
            :companies="store.companies"
            v-model="searchQuery"
            @select="handleCompanySelect"
          />
        </div>

        <div class="header-actions">
          <div class="market-status open hidden md:flex">
            <span class="status-dot"></span>
            <span class="status-text">Market Open</span>
          </div>
          <button class="header-btn">
            <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="btn-text hidden sm:inline">Live</span>
          </button>
          <button class="header-btn primary">
            <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <span class="btn-text hidden sm:inline">Trade</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <!-- Live Ticker -->
      <StockTicker
        :companies="displayedCompanies"
      />

      <!-- Companies Grid -->
      <section class="py-8 px-4 md:px-8">
        <div class="max-w-7xl mx-auto">
          <!-- Section Header -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div>
              <h2 class="text-2xl md:text-3xl font-bold text-dark-50 mb-2">
                {{ filteredCompanies.length > 0 ? 'Search Results' : 'All Companies' }}
              </h2>
              <p class="text-dark-400">
                {{ filteredCompanies.length > 0
                  ? `Found ${filteredCompanies.length} ${filteredCompanies.length !== 1 ? 'companies' : 'company'}`
                  : `${store.companies.length} companies listed on the exchange`
                }}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <!-- All -->
              <button
                @click="activeFilter = 'all'"
                :class="activeFilter === 'all'
                  ? 'text-white bg-blue-600 border-blue-600'
                  : 'text-blue-400 bg-white/5 border border-white/10 hover:bg-white/10'"
                class="h-9 min-w-[90px] flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-all duration-200 border flex-shrink-0 px-3"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span>All</span>
              </button>
              <!-- Gainers -->
              <button
                @click="activeFilter = 'gainers'"
                :class="activeFilter === 'gainers'
                  ? 'text-white bg-green-600 border-green-600'
                  : 'text-green-400 bg-white/5 border border-white/10 hover:bg-white/10'"
                class="h-9 min-w-[90px] flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-all duration-200 border flex-shrink-0 px-3"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
                <span>Gainers</span>
              </button>
              <!-- Losers -->
              <button
                @click="activeFilter = 'losers'"
                :class="activeFilter === 'losers'
                  ? 'text-white bg-red-600 border-red-600'
                  : 'text-red-400 bg-white/5 border border-white/10 hover:bg-white/10'"
                class="h-9 min-w-[90px] flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-all duration-200 border flex-shrink-0 px-3"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
                  <polyline points="16 17 22 17 22 11"/>
                </svg>
                <span>Losers</span>
              </button>
              <!-- Tech -->
              <button
                @click="activeFilter = 'tech'"
                :class="activeFilter === 'tech'
                  ? 'text-white bg-blue-600 border-blue-600'
                  : 'text-blue-400 bg-white/5 border border-white/10 hover:bg-white/10'"
                class="h-9 min-w-[90px] flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-all duration-200 border flex-shrink-0 px-3"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="6" height="6" rx="1"/>
                  <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
                <span>Tech</span>
              </button>
            </div>
          </div>

          <!-- Companies Grid -->
          <div
            v-if="paginatedCompanies.length > 0"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <CompanyCard
              v-for="(company, index) in paginatedCompanies"
              :key="company.name"
              :company="company"
              :stagger-delay="index * 50"
              @details="handleViewDetails(company)"
              @trade="handleTrade(company)"
            />
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="text-center py-16"
          >
            <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-dark-500">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-dark-50 mb-2">No companies found</h3>
            <p class="text-dark-400 mb-6">Try adjusting your search or filter criteria</p>
            <button
              @click="resetSearch"
              class="px-6 py-2 bg-primary-500 text-dark-50 rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Clear Search
            </button>
          </div>

          <!-- Infinite Scroll Sentinel -->
          <div
            ref="sentinel"
            class="w-full py-12 flex items-center justify-center"
          >
            <div
              v-if="loading || hasMore"
              class="flex flex-col items-center gap-3"
            >
              <div class="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
              <p class="text-dark-400 text-sm font-medium">Loading more companies...</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import CompanyCard from './components/CompanyCard.vue'
import StockTicker from './components/StockTicker.vue'
import SearchBar from './components/SearchBar.vue'
import { useStockStore, type Company } from './stores/stockStore'
import { useWebSocket } from './composables/useWebSocket'

// Store & WebSocket
const store = useStockStore()
const { connect, subscribe } = useWebSocket()

// State
const searchQuery = ref('')
const activeFilter = ref('all')
const itemsPerPage = ref(9)
const loading = ref(false)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// Filters
const filters = [
  { id: 'all', label: 'All' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
  { id: 'tech', label: 'Tech' }
]

// Computed
const filteredCompanies = computed(() => {
  let result = store.companies

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(company =>
      company.name.toLowerCase().includes(query) ||
      company.ticker?.some(t => t.toLowerCase().includes(query))
    )
  }

  // Apply category filter
  if (activeFilter.value === 'gainers') {
    result = result.filter(c => (c.change || 0) > 0)
  } else if (activeFilter.value === 'losers') {
    result = result.filter(c => (c.change || 0) < 0)
  } else if (activeFilter.value === 'tech') {
    const techKeywords = ['communication', 'internet', 'software', 'tech', 'mobilfunk', 'netz', 'daten', 'elektronik'];
    const techTickers = ['BADR', 'BDG', 'TNK', 'WHZ', 'EYE', 'FCD', 'FRT', 'IFRT', 'WIZ'];
    result = result.filter(c => 
      techTickers.some(t => c.ticker.includes(t)) ||
      techKeywords.some(k => c.description?.toLowerCase().includes(k)) ||
      techKeywords.some(k => c.name.toLowerCase().includes(k))
    )
  }

  return result
})

const paginatedCompanies = computed(() => {
  return filteredCompanies.value.slice(0, itemsPerPage.value)
})

const hasMore = computed(() => {
  return paginatedCompanies.value.length < filteredCompanies.value.length
})

const displayedCompanies = computed(() => {
  return store.companies
})

// Methods
const loadCompanies = async () => {
  try {
    // Load from local JSON file
    const response = await fetch('/companies.json')
    if (response.ok) {
      const data = await response.json()
      store.setCompanies(data)
      
      // Subscribe to all tickers
      data.forEach((company: Company) => {
        if (company.ticker && company.ticker.length > 0) {
          subscribe(company.ticker[0])
        }
      })
    }
  } catch (error) {
    console.error('Failed to load companies:', error)
  }
}

const loadMore = () => {
  if (hasMore.value && !loading.value) {
    loading.value = true
    setTimeout(() => {
      itemsPerPage.value += 9
      loading.value = false
    }, 500)
  }
}

const resetSearch = () => {
  searchQuery.value = ''
  activeFilter.value = 'all'
  itemsPerPage.value = 9
}

const handleCompanySelect = (company: Company) => {
  console.log('Selected company:', company)
}

const handleViewDetails = (company: Company) => {
  console.log('View details:', company)
}

const handleTrade = (company: Company) => {
  console.log('Trade:', company)
}

onMounted(() => {
  connect()
  loadCompanies()

  // Setup infinite scroll observer
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loading.value) {
      loadMore()
    }
  }, {
    rootMargin: '200px'
  })

  if (sentinel.value) {
    observer.observe(sentinel.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style lang="scss" scoped>
</style>
