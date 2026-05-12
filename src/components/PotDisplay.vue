<template>
  <div class="pot-display">
    <div class="pot-label">POT</div>
    <div class="pot-amount" :class="{ 'pot-updated': justUpdated }">
      {{ formattedPot }}
    </div>
    <div v-if="hasSidePots" class="side-pots">
      <span
        v-for="(sp, i) in (pot?.side ?? [])"
        :key="i"
        class="side-pot"
      >
        Side: ${{ sp.amount }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Pot } from '../models/index'

const props = defineProps<{
  pot: Pot | null
}>()

const justUpdated = ref(false)
let updateTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.pot?.total, () => {
  if (updateTimer) clearTimeout(updateTimer)
  justUpdated.value = true
  updateTimer = setTimeout(() => { justUpdated.value = false }, 400)
})

const formattedPot = computed(() => {
  const total = props.pot?.total ?? 0
  if (total >= 1000) return `$${(total / 1000).toFixed(1)}k`
  return `$${total}`
})

const hasSidePots = computed(() =>
  (props.pot?.side?.length ?? 0) > 0 &&
  props.pot!.side.some(sp => sp.amount > 0)
)
</script>

<style scoped>
.pot-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 20px;
  padding: 6px 20px;
  gap: 2px;
  backdrop-filter: blur(4px);
}

.pot-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 3px;
  color: rgba(201, 168, 76, 0.6);
}

.pot-amount {
  font-size: 22px;
  font-weight: 800;
  color: var(--gold);
  text-shadow: 0 0 10px rgba(201, 168, 76, 0.4);
  transition: all 0.2s ease;
  font-variant-numeric: tabular-nums;
}

.pot-updated {
  animation: pot-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pot-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); color: #f0d080; text-shadow: 0 0 20px rgba(201,168,76,0.8); }
  100% { transform: scale(1); }
}

.side-pots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.side-pot {
  font-size: 9px;
  color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.07);
  padding: 2px 6px;
  border-radius: 8px;
}
</style>
