<template>
  <section class="stock-ticker-section" aria-label="Live stock ticker">
    <div class="ticker-wrapper">
      <div class="ticker-track" :style="{ animationDuration: `${duration}s` }">
        <div
          v-for="(company, index) in displayCompanies"
          :key="`${company.name}-${index}`"
          class="ticker-item"
        >
          <div class="ticker-logo">
            <img
              v-if="company.logoUrl"
              :src="company.logoUrl"
              :alt="company.name"
              @error="handleImageError"
            />
            <span v-else class="logo-text">{{ getInitials(company.name) }}</span>
          </div>
          <div class="ticker-info">
            <span class="ticker-name">{{ company.name }}</span>
            <span class="ticker-symbol">{{ company.ticker?.[0] || 'N/A' }}</span>
          </div>
          <div class="ticker-price">
            <span class="price">{{ formatPrice(getPrice(company)) }}</span>
            <span
              class="change"
              :class="{ positive: isPositive(company), negative: !isPositive(company) }"
            >
              {{ formatChange(getChange(company)) }}
            </span>
          </div>
        </div>
        <!-- Duplicate for seamless loop -->
        <div
          v-for="(company, index) in displayCompanies"
          :key="`${company.name}-dup-${index}`"
          class="ticker-item"
        >
          <div class="ticker-logo">
            <img
              v-if="company.logoUrl"
              :src="company.logoUrl"
              :alt="company.name"
              @error="handleImageError"
            />
            <span v-else class="logo-text">{{ getInitials(company.name) }}</span>
          </div>
          <div class="ticker-info">
            <span class="ticker-name">{{ company.name }}</span>
            <span class="ticker-symbol">{{ company.ticker?.[0] || 'N/A' }}</span>
          </div>
          <div class="ticker-price">
            <span class="price">{{ formatPrice(getPrice(company)) }}</span>
            <span
              class="change"
              :class="{ positive: isPositive(company), negative: !isPositive(company) }"
            >
              {{ formatChange(getChange(company)) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStockStore, type Company } from '../stores/stockStore'

interface Props {
  companies?: Company[]
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  companies: () => [],
  duration: 40
})

const store = useStockStore()

const displayCompanies = computed(() => {
  const companies = props.companies && props.companies.length > 0 
    ? props.companies 
    : store.companies
    
  return companies.slice(0, 15)
})

const getTicker = (company: Company) => company.ticker?.[0] || ''

const getPrice = (company: Company) => {
  const ticker = getTicker(company)
  return store.prices[ticker] ?? company.price ?? 0
}

const getChange = (company: Company) => {
  const ticker = getTicker(company)
  const current = getPrice(company)
  const previous = store.previousPrices[ticker] ?? current
  return current - previous
}

const isPositive = (company: Company) => getChange(company) >= 0

const formatPrice = (price: number) => {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatChange = (change: number) => {
  const sign = change >= 0 ? '+' : ''
  return `${sign}$${change.toFixed(2)}`
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}
</script>
