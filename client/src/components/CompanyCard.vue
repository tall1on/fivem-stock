<template>
  <div
    class="company-card"
    :class="{ 'positive-change': isPositive, 'negative-change': !isPositive }"
    :style="{ animationDelay: `${staggerDelay}ms` }"
  >
    <div class="company-header">
      <div class="company-logo">
        <img
          v-if="company.logoUrl"
          :src="company.logoUrl"
          :alt="company.name"
          @error="handleImageError"
        />
        <span v-else class="logo-placeholder">{{ initials }}</span>
      </div>
      <div class="company-info">
        <h3 class="company-name">{{ company.name }}</h3>
        <span class="company-ticker">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 20V10M12 20V4M6 20v-6"/>
          </svg>
          {{ company.ticker?.join(' / ') || 'N/A' }}
        </span>
        <p v-if="company.description" class="company-description">
          {{ company.description }}
        </p>
      </div>
    </div>

    <div class="stock-price">
      <div>
        <span class="price-value">{{ formattedPrice }}</span>
        <span class="price-currency">USD</span>
      </div>
      <div
        class="stock-change"
        :class="{ positive: isPositive, negative: !isPositive }"
      >
        <span class="change-icon">
          <svg v-if="isPositive" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </span>
        <span>{{ formattedChange }}</span>
      </div>
    </div>

    <div class="company-footer">
      <div class="trading-volume">
        <span class="volume-label">Volume</span>
        <span class="volume-value">{{ formattedVolume }}</span>
      </div>
      <div class="quick-actions">
        <button
          class="action-btn"
          @click="$emit('details')"
          :aria-label="`View details for ${company.name}`"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
        <button
          class="action-btn"
          @click="$emit('trade')"
          :aria-label="`Trade ${company.name}`"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 7h10v10M7 17L17 7"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStockStore, type Company } from '../stores/stockStore'

interface Props {
  company: Company
  staggerDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  staggerDelay: 0
})

const store = useStockStore()

defineEmits<{
  details: []
  trade: []
}>()

const ticker = computed(() => props.company.ticker?.[0] || '')

const currentPrice = computed(() => {
  return store.prices[ticker.value] ?? props.company.price ?? 0
})

const priceChange = computed(() => {
  const oldPrice = store.previousPrices[ticker.value] ?? currentPrice.value
  return currentPrice.value - oldPrice
})

const priceChangePercent = computed(() => {
  const oldPrice = store.previousPrices[ticker.value] ?? currentPrice.value
  if (oldPrice === 0) return 0
  return ((currentPrice.value - oldPrice) / oldPrice) * 100
})

const initials = computed(() => {
  return props.company.name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const isPositive = computed(() => priceChange.value >= 0)

const formattedPrice = computed(() => {
  return currentPrice.value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
})

const formattedChange = computed(() => {
  const change = priceChange.value
  const changePercent = priceChangePercent.value
  const sign = change >= 0 ? '+' : ''
  return `${sign}$${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
})

const formattedVolume = computed(() => {
  const volume = props.company.volume || 0
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`
  }
  return volume.toLocaleString()
})

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}
</script>
