<template>
  <div class="chip-stack" :class="size">
    <div class="chips-visual">
      <div
        v-for="(chip, i) in visibleChips"
        :key="i"
        class="chip"
        :class="`chip-${chip.color}`"
        :style="{ bottom: `${i * 4}px`, zIndex: i }"
      ></div>
    </div>
    <div v-if="showAmount" class="chip-amount">
      <span class="chip-amount-text">{{ formattedAmount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  amount: number
  showAmount?: boolean
  size?: 'sm' | 'md' | 'lg'
  maxChips?: number
}>(), {
  showAmount: true,
  size: 'md',
  maxChips: 8
})

interface ChipDef { color: string; value: number }

const CHIP_COLORS: ChipDef[] = [
  { color: 'black', value: 100 },
  { color: 'purple', value: 25 },
  { color: 'blue', value: 10 },
  { color: 'red', value: 5 },
  { color: 'white', value: 1 },
]

const visibleChips = computed<ChipDef[]>(() => {
  if (props.amount <= 0) return []
  let remaining = props.amount
  const chips: ChipDef[] = []

  for (const chipDef of CHIP_COLORS) {
    const count = Math.min(Math.floor(remaining / chipDef.value), 3)
    for (let i = 0; i < count && chips.length < props.maxChips; i++) {
      chips.push(chipDef)
      remaining -= chipDef.value
    }
    if (chips.length >= props.maxChips) break
  }

  return chips.slice(0, props.maxChips)
})

const formattedAmount = computed(() => {
  if (props.amount >= 1000) return `$${(props.amount / 1000).toFixed(1)}k`
  return `$${props.amount}`
})
</script>

<style scoped>
.chip-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.chips-visual {
  position: relative;
  width: 28px;
  height: 32px;
}

.chip {
  position: absolute;
  left: 0;
  width: 28px;
  height: 14px;
  border-radius: 50%;
  border-bottom: 3px solid rgba(0,0,0,0.4);
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
}

.chip-white {
  background: linear-gradient(180deg, #e8e8e8, #c8c8c8);
  border: 1px solid #aaa;
}

.chip-red {
  background: linear-gradient(180deg, #e53935, #b71c1c);
}

.chip-blue {
  background: linear-gradient(180deg, #1565c0, #0d47a1);
}

.chip-purple {
  background: linear-gradient(180deg, #7b1fa2, #4a148c);
}

.chip-black {
  background: linear-gradient(180deg, #424242, #212121);
}

.chip-amount-text {
  font-size: 11px;
  font-weight: 700;
  color: var(--gold);
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  white-space: nowrap;
}

/* Sizes */
.sm .chips-visual { width: 20px; height: 24px; }
.sm .chip { width: 20px; height: 10px; }
.sm .chip-amount-text { font-size: 9px; }

.lg .chips-visual { width: 36px; height: 44px; }
.lg .chip { width: 36px; height: 18px; }
.lg .chip-amount-text { font-size: 13px; }
</style>
