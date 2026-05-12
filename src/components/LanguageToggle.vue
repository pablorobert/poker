<template>
  <div class="lang-toggle">
    <button
      class="flag-btn"
      :class="{ active: locale === 'en' }"
      @click="setLocale('en')"
      title="English"
    >
      🇺🇸
    </button>
    <button
      class="flag-btn"
      :class="{ active: locale === 'pt' }"
      @click="setLocale('pt')"
      title="Português"
    >
      🇧🇷
    </button>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from '../composables/useLocale'

const { locale, setLocale } = useLocale()
</script>

<style scoped>
.lang-toggle {
  display: flex;
  gap: 6px;
  align-items: center;
}

.flag-btn {
  font-size: 24px;
  background: none;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 4px 6px;
  cursor: pointer;
  line-height: 1;
  transition: all 0.15s ease;
  opacity: 0.45;
  filter: grayscale(40%);
}

.flag-btn:hover {
  opacity: 0.8;
  filter: grayscale(0%);
  transform: scale(1.1);
}

.flag-btn.active {
  opacity: 1;
  filter: grayscale(0%);
  border-color: rgba(201, 168, 76, 0.6);
  background: rgba(201, 168, 76, 0.1);
  box-shadow: 0 0 10px rgba(201, 168, 76, 0.2);
}
</style>
