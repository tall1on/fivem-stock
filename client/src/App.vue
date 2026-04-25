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
          <div>
            <h1 class="header-title">FiveM Stock</h1>
            <p class="header-subtitle">Virtual Stock Exchange</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="market-status open">
            <span class="status-dot"></span>
            <span class="status-text">Market Open</span>
          </div>
          <button class="header-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="btn-text">Live</span>
          </button>
          <button class="header-btn primary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <span class="btn-text">Trade</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <!-- Search Section -->
      <section class="search-section py-6 px-4 md:px-8">
        <div class="max-w-4xl mx-auto">
          <SearchBar
            :companies="companies"
            v-model="searchQuery"
            @select="handleCompanySelect"
          />
        </div>
      </section>

      <!-- Live Ticker -->
      <StockTicker
        :companies="displayedCompanies"
        :duration="40"
      />

      <!-- Companies Grid -->
      <section class="py-8 px-4 md:px-8">
        <div class="max-w-7xl mx-auto">
          <!-- Section Header -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 class="text-2xl md:text-3xl font-bold text-dark-50 mb-2">
                {{ filteredCompanies.length > 0 ? 'Search Results' : 'All Companies' }}
              </h2>
              <p class="text-dark-400">
                {{ filteredCompanies.length > 0
                  ? `Found ${filteredCompanies.length} company${filteredCompanies.length !== 1 ? 'ies' : ''}`
                  : `${companies.length} companies listed on the exchange`
                }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                v-for="filter in filters"
                :key="filter.id"
                @click="activeFilter = filter.id"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                :class="activeFilter === filter.id
                  ? 'bg-primary-500 text-dark-50 shadow-lg shadow-primary-500/20'
                  : 'bg-dark-700 text-dark-400 hover:text-dark-50 hover:bg-dark-600'
                "
              >
                {{ filter.label }}
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

interface Company {
  name: string
  ticker?: string[]
  logo?: string
  logoUrl?: string
  description?: string | null
  price?: number
  change?: number
  changePercent?: number
  volume?: number
}

// State
const companies = ref<Company[]>([])
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
  let result = companies.value

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
  return companies.value.slice(0, 15)
})

// Methods
const loadCompanies = async () => {
  try {
    // Load from local JSON file
    const response = await fetch('/.config/companies.json')
    if (response.ok) {
      const data = await response.json()
      companies.value = data.map((company: any) => ({
        ...company,
        price: company.price || Math.random() * 500 + 10,
        change: company.change || (Math.random() - 0.5) * 20,
        changePercent: company.changePercent || (Math.random() - 0.5) * 10,
        volume: company.volume || Math.floor(Math.random() * 10000000) + 100000
      }))
    }
  } catch (error) {
    console.error('Failed to load companies:', error)
    // Fallback to sample data
    companies.value = generateSampleData()
  }
}

const generateSampleData = () => {
  const sampleNames = [
    { name: 'Alpha Mail', ticker: ['ALPH', 'MAIL'] },
    { name: 'Ammu-Nation', ticker: ['AMU'] },
    { name: 'Badger Communications', ticker: ['BADR', 'BDG'] },
    { name: 'Bank of Liberty', ticker: ['BANK', 'LIB'] },
    { name: 'BAWSAQ', ticker: ['BAWS'] },
    { name: 'Bean Machine', ticker: ['BEAN'] },
    { name: 'Betta Pharmaceuticals', ticker: ['BETA', 'BET'] },
    { name: 'Biglogs', ticker: ['BIGL'] },
    { name: 'Binco', ticker: ['BNCO', 'BIN'] },
    { name: 'BitterSweet', ticker: ['BTR'] },
    { name: 'Bleeter.biz', ticker: ['BLE'] },
    { name: 'Brute', ticker: ['BRU'] },
    { name: 'Burger Shot', ticker: ['BSHT'] },
    { name: 'Bürgerfahrzeug', ticker: ['BFA'] },
    { name: 'Candybox', ticker: ['CABOX'] },
    { name: 'Canyon Entertainment', ticker: ['CANE'] },
    { name: 'Cluckin Bell', ticker: ['CUBEL'] },
    { name: 'CNT', ticker: ['CNTU', 'CNT'] },
    { name: 'Crevis', ticker: ['CRE'] },
    { name: 'Daily Globe', ticker: ['DGP'] },
    { name: 'Eyefind', ticker: ['EYEF', 'EYE'] },
    { name: 'eCola', ticker: ['ECLA'] },
    { name: 'Eris', ticker: ['ERIS'] },
    { name: 'Facade', ticker: ['FAC'] },
    { name: 'Fleeca', ticker: ['FLEE'] },
    { name: 'Fruit', ticker: ['FRUC', 'FRT'] },
    { name: 'Genic', ticker: ['GNIC'] },
    { name: 'Globe Oil', ticker: ['GLBOIL'] },
    { name: 'Gruppe Sechs', ticker: ['GRUP', 'SECHS'] },
    { name: 'Hawk & Little', ticker: ['HAL'] },
    { name: 'heat', ticker: ['HEAT'] },
    { name: 'HVY Industries', ticker: ['HVY'] },
    { name: 'Liberty Sports Network', ticker: ['LSNW'] },
    { name: 'Logger', ticker: ['LOGR'] },
    { name: 'Lombank', ticker: ['LOMB'] },
    { name: 'Los Santos Customs', ticker: ['LSC'] },
    { name: 'Los Santos Water & Power', ticker: ['WAP'] },
    { name: 'Los Santos Transit', ticker: ['LST'] },
    { name: 'LTD Gasoline', ticker: ['LTD'] },
    { name: 'Maibatsu Corporation', ticker: ['MAI'] },
    { name: 'Max Renda', ticker: ['MAXR'] },
    { name: 'Music and Entertainment TV', ticker: ['METV'] },
    { name: 'Nx-Jn', ticker: ['NXJN'] },
    { name: 'Pißwasser', ticker: ['PIS'] },
    { name: 'Ponsonbys', ticker: ['PON'] },
    { name: 'Pump & Run Gymnasium', ticker: ['PMP'] },
    { name: 'RON', ticker: ['RONO', 'RON'] },
    { name: 'SchlongbergSachs', ticker: ['SCHL', 'SACHS'] },
    { name: 'Schmidt & Priss', ticker: ['SCHM', 'PRIS'] },
    { name: 'Schyster', ticker: ['SHT'] },
    { name: 'Shark', ticker: ['SHRK', 'SHK'] },
    { name: 'Shrewsbury Shotguns', ticker: ['SHR'] },
    { name: 'Sprunk Incorporated', ticker: ['SPUK', 'SPU'] },
    { name: 'SubUrban', ticker: ['SUB'] }
  ]

  return sampleNames.map((company, index) => ({
    ...company,
    description: `A leading company in the ${index % 5 === 0 ? 'technology' : index % 5 === 1 ? 'finance' : index % 5 === 2 ? 'retail' : index % 5 === 3 ? 'manufacturing' : 'services'} sector.`,
    price: Math.random() * 500 + 10,
    change: (Math.random() - 0.5) * 20,
    changePercent: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 10000000) + 100000,
    logoUrl: `/logo/${company.name.replace(/[^a-zA-Z0-9]/g, '-')}.webp`
  }))
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
  loadCompanies()
})
</script>
