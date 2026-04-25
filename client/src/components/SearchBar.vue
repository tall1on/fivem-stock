<template>
  <div class="search-section">
    <div class="search-wrapper">
      <div class="search-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </div>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Search companies by name or ticker..."
        aria-label="Search companies"
        @input="handleInput"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="closeDropdown"
        @focus="openDropdown"
        @blur="handleBlur"
      />
      <button
        v-if="searchQuery"
        ref="clearButton"
        class="search-clear"
        @click="clearSearch"
        aria-label="Clear search"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div
        v-if="isOpen && filteredCompanies.length > 0"
        ref="dropdown"
        class="search-dropdown"
      >
        <div
          v-for="(company, index) in filteredCompanies"
          :key="company.name"
          class="search-result-item"
          :class="{ highlighted: highlightedIndex === index }"
          @click="selectCompany(company)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="search-result-logo">
            <img
              v-if="company.logoUrl"
              :src="company.logoUrl"
              :alt="company.name"
              @error="handleImageError"
            />
            <span v-else class="logo-text">{{ getInitials(company.name) }}</span>
          </div>
          <div class="search-result-info">
            <div class="search-result-name">{{ company.name }}</div>
            <div class="search-result-ticker">{{ company.ticker?.join(' / ') || 'N/A' }}</div>
          </div>
        </div>
      </div>
      <div v-else-if="isOpen && searchQuery && filteredCompanies.length === 0" class="search-dropdown">
        <div class="search-no-results">
          No companies found matching "{{ searchQuery }}"
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

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

interface Props {
  companies?: Company[]
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  companies: () => [],
  modelValue: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', company: Company): void
}>()

const searchQuery = ref(props.modelValue)
const isOpen = ref(false)
const highlightedIndex = ref(-1)
const searchInput = ref<HTMLInputElement | null>(null)
const clearButton = ref<HTMLButtonElement | null>(null)
const dropdown = ref<HTMLElement | null>(null)

let clickOutsideHandler: ((e: MouseEvent) => void) | null = null

const filteredCompanies = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.companies.slice(0, 10)
  }
  const query = searchQuery.value.toLowerCase().trim()
  return props.companies.filter(company =>
    company.name.toLowerCase().includes(query) ||
    company.ticker?.some(t => t.toLowerCase().includes(query))
  ).slice(0, 10)
})

const handleInput = () => {
  emit('update:modelValue', searchQuery.value)
  openDropdown()
}

const openDropdown = () => {
  isOpen.value = true
  highlightedIndex.value = -1
}

const closeDropdown = () => {
  isOpen.value = false
  highlightedIndex.value = -1
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('update:modelValue', '')
  searchInput.value?.focus()
}

const highlightNext = () => {
  if (highlightedIndex.value < filteredCompanies.value.length - 1) {
    highlightedIndex.value++
    scrollToHighlighted()
  }
}

const highlightPrev = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
    scrollToHighlighted()
  }
}

const scrollToHighlighted = () => {
  nextTick(() => {
    const highlighted = dropdown.value?.querySelector('.highlighted')
    if (highlighted && dropdown.value) {
      const dropdownRect = dropdown.value.getBoundingClientRect()
      const highlightedRect = highlighted.getBoundingClientRect()
      if (highlightedRect.bottom > dropdownRect.bottom) {
        highlighted.scrollIntoView({ block: 'end', behavior: 'smooth' })
      }
      if (highlightedRect.top < dropdownRect.top) {
        highlighted.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    }
  })
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredCompanies.value.length) {
    selectCompany(filteredCompanies.value[highlightedIndex.value])
  }
}

const selectCompany = (company: Company) => {
  searchQuery.value = company.name
  emit('update:modelValue', company.name)
  emit('select', company)
  closeDropdown()
  searchInput.value?.focus()
}

const handleBlur = (e: FocusEvent) => {
  // Delay closing to allow click events to fire
  setTimeout(() => {
    if (!dropdown.value?.contains(document.activeElement)) {
      closeDropdown()
    }
  }, 150)
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const handleClickOutside = (e: MouseEvent) => {
  if (searchInput.value && !searchInput.value.contains(e.target as Node) &&
      !dropdown.value?.contains(e.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  clickOutsideHandler = handleClickOutside
  document.addEventListener('click', clickOutsideHandler)
})

onUnmounted(() => {
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler)
  }
})
</script>
