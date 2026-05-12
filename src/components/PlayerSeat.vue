<template>
  <div
    class="player-seat"
    :class="[
      `position-${position}`,
      `status-${player.status}`,
      { 'is-active': isActive, 'is-winner': player.status === 'winner', 'is-human': player.type === 'human' }
    ]"
  >
    <!-- Active player ring -->
    <div v-if="isActive" class="active-ring"></div>

    <!-- Cards -->
    <div class="seat-cards" :class="{ 'cards-above': position >= 4 }">
      <template v-if="player.cards.length > 0">
        <PlayingCard
          v-for="(card, idx) in player.cards"
          :key="idx"
          :card="card"
          :face-down="player.type === 'cpu' && !cpuCardsVisible"
          size="sm"
          :style="{ transform: `rotate(${idx === 0 ? -6 : 6}deg)` }"
        />
      </template>
      <template v-else>
        <div v-for="i in 2" :key="i" class="card-placeholder"></div>
      </template>
    </div>

    <!-- Player info -->
    <div class="seat-info">
      <div class="seat-avatar">
        <span class="avatar-emoji">{{ player.avatar }}</span>
        <div v-if="player.status === 'thinking'" class="thinking-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
      <div class="seat-details">
        <div class="seat-name">{{ player.name }}</div>
        <div class="seat-chips">
          <span class="chips-icon">🪙</span>
          <span class="chips-amount">{{ formatChips(player.chips) }}</span>
        </div>
      </div>
    </div>

    <!-- Status badges -->
    <DealerButton
      :is-dealer="player.isDealer"
      :is-small-blind="player.isSmallBlind"
      :is-big-blind="player.isBigBlind"
    />

    <!-- Bet amount -->
    <div v-if="player.currentBet > 0" class="bet-amount">
      <ChipStack :amount="player.currentBet" size="sm" />
    </div>

    <!-- Status overlay -->
    <div v-if="player.status === 'folded'" class="status-overlay folded-overlay">{{ t('status.folded') }}</div>
    <div v-if="player.status === 'all-in'" class="status-overlay allin-overlay">{{ t('status.allIn') }}</div>
    <div v-if="player.status === 'sitting-out'" class="status-overlay sitout-overlay">{{ t('status.out') }}</div>

    <!-- Winner celebration -->
    <transition name="winner-pop">
      <div v-if="player.status === 'winner' && player.winAmount" class="winner-badge">
        <div class="winner-crown">👑</div>
        <div class="winner-amount">+{{ formatChips(player.winAmount) }}</div>
        <div v-if="player.handDescription" class="winner-hand">{{ player.handDescription }}</div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '../models/index'
import { useLocale } from '../composables/useLocale'
import PlayingCard from './PlayingCard.vue'
import ChipStack from './ChipStack.vue'
import DealerButton from './DealerButton.vue'

const props = defineProps<{
  player: Player
  isActive: boolean
  position: number
  showCpuCards?: boolean
}>()

const cpuCardsVisible = computed(() => props.showCpuCards ?? false)
const { t } = useLocale()

function formatChips(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`
  return `$${amount}`
}
</script>

<style scoped>
.player-seat {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(10, 20, 35, 0.85);
  border: 2px solid rgba(255,255,255,0.08);
  min-width: 110px;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.is-human {
  border-color: rgba(201, 168, 76, 0.3);
}

.active-ring {
  position: absolute;
  inset: -4px;
  border-radius: 14px;
  border: 3px solid var(--gold);
  animation: pulse-ring 1.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse-ring {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.4); }
  50% { opacity: 0.7; box-shadow: 0 0 0 8px rgba(201, 168, 76, 0); }
}

.is-winner {
  animation: winner-glow 2s ease-in-out infinite;
}

@keyframes winner-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(201, 168, 76, 0.3); border-color: rgba(201,168,76,0.5); }
  50% { box-shadow: 0 0 30px rgba(201, 168, 76, 0.8); border-color: var(--gold); }
}

.seat-cards {
  display: flex;
  gap: -4px;
  margin-bottom: 2px;
  position: relative;
}

.card-placeholder {
  width: 42px;
  height: 62px;
  border-radius: 5px;
  border: 2px dashed rgba(255,255,255,0.15);
  background: rgba(0,0,0,0.2);
}

.seat-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.seat-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.thinking-dots {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 3px;
}

.thinking-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold);
  animation: dot-bounce 1.2s infinite;
}

.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

.seat-details {
  flex: 1;
  min-width: 0;
}

.seat-name {
  font-size: 12px;
  font-weight: 700;
  color: #e8e8e8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seat-chips {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--gold);
  font-weight: 600;
}

.chips-icon { font-size: 10px; }

.bet-amount {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
}

.status-overlay {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  pointer-events: none;
}

.folded-overlay {
  background: rgba(0,0,0,0.65);
  color: rgba(255,255,255,0.4);
}

.allin-overlay {
  background: rgba(183, 28, 28, 0.4);
  color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255,107,107,0.8);
  animation: allin-pulse 1.5s ease infinite;
}

@keyframes allin-pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; text-shadow: 0 0 20px rgba(255,107,107,1); }
}

.sitout-overlay {
  background: rgba(0,0,0,0.6);
  color: rgba(255,255,255,0.3);
}

.winner-badge {
  position: absolute;
  top: -70px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c);
  color: #1a0a00;
  border-radius: 10px;
  padding: 6px 12px;
  text-align: center;
  min-width: 100px;
  box-shadow: 0 4px 20px rgba(201,168,76,0.6);
  white-space: nowrap;
}

.winner-crown {
  font-size: 18px;
}

.winner-amount {
  font-size: 14px;
  font-weight: 800;
}

.winner-hand {
  font-size: 9px;
  font-weight: 600;
  opacity: 0.8;
}

.winner-pop-enter-active {
  animation: winner-pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.winner-pop-leave-active {
  animation: winner-pop-in 0.3s ease reverse;
}

@keyframes winner-pop-in {
  from { transform: translateX(-50%) scale(0.5); opacity: 0; }
  to { transform: translateX(-50%) scale(1); opacity: 1; }
}

/* Status dimming */
.status-folded .seat-cards,
.status-folded .seat-info {
  opacity: 0.4;
}

.status-sitting-out .seat-info {
  opacity: 0.3;
}
</style>
