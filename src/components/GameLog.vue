<template>
  <div class="game-log" :class="{ collapsed: isCollapsed }">
    <div class="log-header" @click="isCollapsed = !isCollapsed">
      <span class="log-title">Hand History</span>
      <span class="log-toggle">{{ isCollapsed ? '◀' : '▶' }}</span>
    </div>
    <div v-if="!isCollapsed" class="log-body">
      <div v-if="recentActions.length === 0" class="log-empty">
        No actions yet
      </div>
      <TransitionGroup name="log-item" tag="div" class="log-actions">
        <div
          v-for="(bet, idx) in recentActions"
          :key="`${bet.playerId}-${bet.timestamp}-${idx}`"
          class="log-entry"
          :class="`action-${bet.action}`"
        >
          <span class="entry-player">{{ bet.playerName }}</span>
          <span class="entry-action">{{ actionLabel(bet.action) }}</span>
          <span v-if="bet.amount > 0" class="entry-amount">${{ bet.amount }}</span>
        </div>
      </TransitionGroup>
      <div v-if="history.length > 0" class="log-section-title">Past Hands</div>
      <div
        v-for="hand in recentHistory"
        :key="hand.roundNumber"
        class="log-hand"
      >
        <div class="hand-header">
          <span class="hand-round">Round {{ hand.roundNumber }}</span>
          <span class="hand-pot">${{ hand.potAmount }}</span>
        </div>
        <div class="hand-winner">
          🏆 {{ hand.winners.join(', ') }}
          <span class="hand-desc">{{ hand.winningHand }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BetRecord, HandHistoryEntry, BetAction } from '../models/index'

const props = defineProps<{
  recentBets: BetRecord[]
  history: HandHistoryEntry[]
}>()

const isCollapsed = ref(false)

const recentActions = computed(() => [...props.recentBets].reverse().slice(0, 15))
const recentHistory = computed(() => [...props.history].reverse().slice(0, 5))

function actionLabel(action: BetAction): string {
  const labels: Record<BetAction, string> = {
    fold: 'folds',
    check: 'checks',
    call: 'calls',
    raise: 'raises',
    'all-in': 'all-in!'
  }
  return labels[action]
}
</script>

<style scoped>
.game-log {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.6);
  border-left: 1px solid rgba(255,255,255,0.08);
  width: 220px;
  min-width: 220px;
  max-width: 220px;
  transition: max-width 0.3s ease;
  overflow: hidden;
}

.game-log.collapsed {
  max-width: 40px;
  min-width: 40px;
  width: 40px;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  user-select: none;
  flex-shrink: 0;
}

.log-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(201, 168, 76, 0.7);
  white-space: nowrap;
}

.log-toggle {
  font-size: 10px;
  color: rgba(255,255,255,0.3);
}

.log-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.log-empty {
  text-align: center;
  font-size: 11px;
  color: rgba(255,255,255,0.2);
  padding: 20px 0;
}

.log-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 11px;
  background: rgba(255,255,255,0.03);
  flex-wrap: wrap;
}

.entry-player {
  font-weight: 700;
  color: #ddd;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-action {
  color: rgba(255,255,255,0.5);
  flex: 1;
}

.entry-amount {
  font-weight: 700;
  color: var(--gold);
}

.action-fold .entry-action { color: #ff6b6b; }
.action-raise .entry-action { color: #69db7c; }
.action-all-in .entry-action { color: #ffd43b; font-weight: 700; }
.action-check .entry-action { color: #74c0fc; }
.action-call .entry-action { color: #a9e34b; }

.log-section-title {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.2);
  margin: 8px 0 4px;
  padding: 0 4px;
}

.log-hand {
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
  padding: 6px 8px;
  margin-bottom: 4px;
}

.hand-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.hand-round {
  font-size: 10px;
  color: rgba(255,255,255,0.3);
}

.hand-pot {
  font-size: 10px;
  color: var(--gold);
  font-weight: 700;
}

.hand-winner {
  font-size: 10px;
  color: rgba(255,255,255,0.6);
}

.hand-desc {
  display: block;
  font-size: 9px;
  color: rgba(255,255,255,0.3);
  margin-top: 1px;
}

/* Log item animation */
.log-item-enter-active {
  animation: log-slide 0.3s ease;
}

@keyframes log-slide {
  from { transform: translateX(10px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
