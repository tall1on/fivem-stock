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
            :companies="companies"
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
                  : `${companies.length} companies listed on the exchange`
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
    const response = await fetch('/companies.json')
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
    { name: 'Alpha Mail', ticker: ['ALPH', 'MAIL'], logoUrl: '/logo/Alpha-Mail-Logo.webp' },
    { name: 'Ammu-Nation', ticker: ['AMU'], logoUrl: '/logo/Ammu-Nation-Logo_2013.PNG.webp' },
    { name: 'Badger Communications', ticker: ['BADR', 'BDG'], logoUrl: '/logo/Badger-Logo.webp' },
    { name: 'Bank of Liberty', ticker: ['BANK', 'LIB'], logoUrl: '/logo/Bank-of-Liberty-Logo.PNG.webp' },
    { name: 'BAWSAQ', ticker: ['BAWS'], logoUrl: '/logo/BAWSAQ-Logo.PNG.webp' },
    { name: 'Bean Machine', ticker: ['BEAN'], logoUrl: '/logo/Bean-Machine-Logo.webp' },
    { name: 'Betta Pharmaceuticals', ticker: ['BETA', 'BET'], logoUrl: '/logo/Baw-betta.webp' },
    { name: 'Biglogs', ticker: ['BIGL'], logoUrl: '/logo/Biglogs-Logo.webp' },
    { name: 'Binco', ticker: ['BNCO', 'BIN'], logoUrl: '/logo/Binco-Logo_2008.webp' },
    { name: 'BitterSweet', ticker: ['BTR'], logoUrl: '/logo/BitterSweet-Logo.webp' },
    { name: 'Bleeter.biz', ticker: ['BLE'], logoUrl: '/logo/Bleeter_Banner_IV.png.webp' },
    { name: 'Brute', ticker: ['BRU'], logoUrl: '/logo/Brute-Logo.PNG.webp' },
    { name: 'Burger Shot', ticker: ['BSHT'], logoUrl: '/logo/Burger-Shot-Logo.webp' },
    { name: 'Bürgerfahrzeug', ticker: ['BFA'], logoUrl: '/logo/Baw-bürgerfahrzeug.webp' },
    { name: 'Candybox', ticker: ['CABOX'], logoUrl: '/logo/Candybox-Logo.PNG.webp' },
    { name: 'Canyon Entertainment', ticker: ['CANE'], logoUrl: '/logo/Canyon-Entertainment-Logo_VCS.PNG.webp' },
    { name: 'Cluckin Bell', ticker: ['CUBEL'], logoUrl: '/logo/Cluckin-Bell-Logo.PNG.webp' },
    { name: 'CNT', ticker: ['CNTU', 'CNT'], logoUrl: '/logo/CNT_Gold_White_IV.webp' },
    { name: 'Crevis', ticker: ['CRE'], logoUrl: '/logo/Crevis-Logo.PNG.webp' },
    { name: 'Daily Globe', ticker: ['DGP'], logoUrl: '/logo/Daily-Globe-Logo.webp' },
    { name: 'Eyefind', ticker: ['EYEF', 'EYE'], logoUrl: '/logo/Eyefind-Logo.PNG.webp' },
    { name: 'eCola', ticker: ['ECLA'], logoUrl: '/logo/ECola-Logo.PNG.webp' },
    { name: 'Eris', ticker: ['ERIS'], logoUrl: '/logo/Eris_Gelb_Logo.webp' },
    { name: 'Facade', ticker: ['FAC'], logoUrl: '/logo/Facade_Logo_HQ.webp' },
    { name: 'Fleeca', ticker: ['FLEE'], logoUrl: '/logo/Lcn-fleeca.webp' },
    { name: 'Fruit', ticker: ['FRUC', 'FRT'], logoUrl: '/logo/Fruit-Logo_1984_HQ_VCS.webp' },
    { name: 'Genic', ticker: ['GNIC'], logoUrl: '/logo/Genic-Logo.PNG.webp' },
    { name: 'Globe Oil', ticker: ['GLBOIL'], logoUrl: '/logo/Globe-Oil-Logo.svg' },
    { name: 'Gruppe Sechs', ticker: ['GRUP', 'SECHS'], logoUrl: '/logo/Gruppe-Sechs-Logo.PNG.webp' },
    { name: 'Hawk & Little', ticker: ['HAL'], logoUrl: '/logo/Baw-hawkandlittle.webp' },
    { name: 'heat', ticker: ['HEAT'], logoUrl: '/logo/Heat-Logo.webp' },
    { name: 'HVY Industries', ticker: ['HVY'], logoUrl: '/logo/Baw-hvy.webp' },
    { name: 'Liberty Sports Network', ticker: ['LSNW'], logoUrl: '/logo/Liberty_Sports_Network_Logo.webp' },
    { name: 'Logger', ticker: ['LOGR'], logoUrl: '/logo/Logger-Beer-Logo_IV.PNG.webp' },
    { name: 'Lombank', ticker: ['LOMB'], logoUrl: '/logo/LomBank_Logo.webp' },
    { name: 'Los Santos Customs', ticker: ['LSC'], logoUrl: '/logo/LS_Customs_Logo_V.webp' },
    { name: 'Los Santos Water & Power', ticker: ['WAP'], logoUrl: '/logo/Los_Santos_Department_of_Water_Power_Logo_V.webp' },
    { name: 'Los Santos Transit', ticker: ['LST'], logoUrl: '/logo/Los_Santos_Transit_logo.webp' },
    { name: 'LTD Gasoline', ticker: ['LTD'], logoUrl: '/logo/LTD-Gasoline-Logo.PNG.webp' },
    { name: 'Maibatsu Corporation', ticker: ['MAI'], logoUrl: '/logo/Maibatsu-Logo.PNG.webp' },
    { name: 'Max Renda', ticker: ['MAXR'], logoUrl: '/logo/Lcn-maxrenda.webp' },
    { name: 'Music and Entertainment TV', ticker: ['METV'], logoUrl: '/logo/MeTV-Logo_VCS.PNG.webp' },
    { name: 'Nx-Jn', ticker: ['NXJN'], logoUrl: '/logo/Nx-Jn-Logo.PNG.webp' },
    { name: 'Pißwasser', ticker: ['PIS'], logoUrl: '/logo/Pißwasser-Logo.PNG.webp' },
    { name: 'Ponsonbys', ticker: ['PON'], logoUrl: '/logo/Ponsonbys_Wortmarke.webp' },
    { name: 'Pump & Run Gymnasium', ticker: ['PMP'], logoUrl: '/logo/Pump_and_Run_Gymnasium_wortmarke.webp' },
    { name: 'RON', ticker: ['RONO', 'RON'], logoUrl: '/logo/RON-Logo_3.PNG.webp' },
    { name: 'SchlongbergSachs', ticker: ['SCHL', 'SACHS'], logoUrl: '/logo/SchlongbergSachs-Logo.PNG.webp' },
    { name: 'Schmidt & Priss', ticker: ['SCHM', 'PRIS'], logoUrl: '/logo/Schmidt-Priss-Logo.PNG.webp' },
    { name: 'Schyster', ticker: ['SHT'], logoUrl: '/logo/Baw-schyster.webp' },
    { name: 'Shark', ticker: ['SHRK', 'SHK'], logoUrl: '/logo/SHARK-Logo.PNG.webp' },
    { name: 'Shrewsbury Shotguns', ticker: ['SHR'], logoUrl: '/logo/Shrewsbury_Shotguns_Wortmarke.webp' },
    { name: 'Sprunk Incorporated', ticker: ['SPUK', 'SPU'], logoUrl: '/logo/Sprunk-Logo.PNG.webp' },
    { name: 'SubUrban', ticker: ['SUB'], logoUrl: '/logo/SubUrban-Logo2.webp' }
  ]

  return sampleNames.map((company, index) => ({
    ...company,
    description: `A leading company in the ${index % 5 === 0 ? 'technology' : index % 5 === 1 ? 'finance' : index % 5 === 2 ? 'retail' : index % 5 === 3 ? 'manufacturing' : 'services'} sector.`,
    price: Math.random() * 500 + 10,
    change: (Math.random() - 0.5) * 20,
    changePercent: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 10000000) + 100000
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
