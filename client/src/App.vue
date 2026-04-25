<template>
  <div id="app" class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-brand">
          <div class="header-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="btn-text hidden sm:inline">Live</span>
          </button>
          <button class="header-btn primary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        :duration="40"
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
                  ? `Found ${filteredCompanies.length} company${filteredCompanies.length !== 1 ? 'ies' : ''}`
                  : `${store.companies.length} companies listed on the exchange`
                }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="filter in filters"
                :key="filter.id"
                @click="activeFilter = filter.id"
                class="group relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden"
                :class="activeFilter === filter.id
                  ? 'text-dark-50'
                  : 'bg-dark-800/50 text-dark-400 hover:text-dark-100 border border-dark-700/50'
                "
              >
                <!-- Background Gradient for Active State -->
                <div
                  v-if="activeFilter === filter.id"
                  class="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500"
                ></div>
                
                <!-- Hover Effect -->
                <div
                  class="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  v-if="activeFilter !== filter.id"
                ></div>

                <span class="relative flex items-center gap-2">
                  <component
                    :is="filter.id === 'all' ? 'svg' : filter.id === 'gainers' ? 'svg' : 'svg'"
                    v-if="filter.id === 'all'"
                    class="w-4 h-4"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  >
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </component>
                  <svg
                    v-else-if="filter.id === 'gainers'"
                    class="w-4 h-4 text-green-400"
                    :class="{ 'text-white': activeFilter === 'gainers' }"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  >
                    <path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>
                  </svg>
                  <svg
                    v-else-if="filter.id === 'losers'"
                    class="w-4 h-4 text-red-400"
                    :class="{ 'text-white': activeFilter === 'losers' }"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  >
                    <path d="M23 18l-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/>
                  </svg>
                  {{ filter.label }}
                </span>
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

          <!-- Load More -->
          <div
            v-if="hasMore"
            class="text-center mt-8"
          >
            <button
              @click="loadMore"
              class="px-8 py-3 bg-dark-700 hover:bg-dark-600 text-dark-50 rounded-xl font-medium transition-all border border-dark-600 hover:border-primary-500"
              :disabled="loading"
            >
              {{ loading ? 'Loading...' : 'Load More Companies' }}
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-dark-700 bg-dark-900/50">
      <div class="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-dark-500 text-sm">
            © 2026 FiveM Stock Exchange. All rights reserved.
          </p>
          <div class="flex gap-6">
            <a href="#" class="text-dark-400 hover:text-dark-50 text-sm transition-colors">Terms</a>
            <a href="#" class="text-dark-400 hover:text-dark-50 text-sm transition-colors">Privacy</a>
            <a href="#" class="text-dark-400 hover:text-dark-50 text-sm transition-colors">Help</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  return store.companies.slice(0, 15)
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
})
</script>
