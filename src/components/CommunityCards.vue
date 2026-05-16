<template>
  <div class="community-cards">
    <div class="phase-label" v-if="phaseLabel">{{ phaseLabel }}</div>
    <div class="cards-row">
      <TransitionGroup name="card-deal" tag="div" class="cards-inner">
        <template v-for="i in 5" :key="i">
          <PlayingCard
            v-if="cards[i - 1]"
            :card="cards[i - 1]"
            size="lg"
            class="community-card"
          />
          <div
            v-else
            class="card-placeholder-board"
            :class="{ 'upcoming': i <= upcomingCount }"
          ></div>
        </template>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card, GamePhase } from '../models/index'
import PlayingCard from './PlayingCard.vue'
import { useLocale } from '../composables/useLocale'

const props = defineProps<{
  cards: Card[]
  phase: GamePhase | null
}>()

const { t } = useLocale()

const phaseLabel = computed(() => {
  if (!props.phase) return ''
  const phases: GamePhase[] = ['pre-flop', 'flop', 'turn', 'river', 'showdown']
  if (!phases.includes(props.phase)) return ''
  return t(`phase.${props.phase}` as Parameters<typeof t>[0]).toUpperCase()
})

const upcomingCount = computed(() => {
  const phase = props.phase
  if (!phase) return 0
  if (phase === 'pre-flop') return 3
  if (phase === 'flop') return 1
  if (phase === 'turn') return 1
  return 0
})
</script>

<style scoped>
.community-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.phase-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 3px;
  color: rgba(201, 168, 76, 0.7);
  text-transform: uppercase;
}

.cards-row {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cards-inner {
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
}

.community-card {
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6));
}

.card-placeholder-board {
  width: 80px;
  height: 116px;
  border-radius: 6px;
  border: 2px dashed rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.2);
}

.card-placeholder-board.upcoming {
  border-color: rgba(201,168,76,0.2);
  background: rgba(201,168,76,0.04);
  animation: placeholder-pulse 2s ease-in-out infinite;
}

@keyframes placeholder-pulse {
  0%, 100% { border-color: rgba(201,168,76,0.15); }
  50% { border-color: rgba(201,168,76,0.4); }
}

.card-deal-enter-active {
  animation: deal-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.card-deal-leave-active {
  position: absolute;
  pointer-events: none;
  animation: deal-in 0.2s ease reverse;
}

@keyframes deal-in {
  from {
    transform: translateY(-30px) scale(0.8) rotateX(45deg);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1) rotateX(0);
    opacity: 1;
  }
}
</style>
