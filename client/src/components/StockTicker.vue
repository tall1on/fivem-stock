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
            <div class="ticker-name">{{ company.name }}</div>
            <div class="ticker-symbol">{{ company.ticker?.join(' / ') || 'N/A' }}</div>
          </div>
          <div class="ticker-price">
            <div class="price">{{ formatPrice(company.price) }}</div>
            <div
              class="change"
              :class="{ positive: isPositive(company), negative: !isPositive(company) }"
            >
              {{ formatChange(company.change) }}
            </div>
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
            <div class="ticker-name">{{ company.name }}</div>
            <div class="ticker-symbol">{{ company.ticker?.join(' / ') || 'N/A' }}</div>
          </div>
          <div class="ticker-price">
            <div class="price">{{ formatPrice(company.price) }}</div>
            <div
              class="change"
              :class="{ positive: isPositive(company), negative: !isPositive(company) }"
            >
              {{ formatChange(company.change) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Company {
  name: string
  ticker?: string[]
  logo?: string
  logoUrl?: string
  price?: number
  change?: number
}

interface Props {
  companies?: Company[]
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  companies: () => [],
  duration: 40
})

const displayCompanies = computed(() => {
  if (!props.companies || props.companies.length === 0) {
    return []
  }
  return props.companies.slice(0, 15)
})

const isPositive = (company: Company) => (company.change || 0) >= 0

const formatPrice = (price?: number) => {
  const p = price || 0
  return p.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatChange = (change?: number) => {
  const c = change || 0
  const sign = c >= 0 ? '+' : ''
  return `${sign}$${c.toFixed(2)}`
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
