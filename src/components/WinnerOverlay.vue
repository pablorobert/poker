<template>
  <Transition name="winner-overlay">
    <div v-if="show" class="winner-overlay" @click="$emit('dismiss')">
      <div class="winner-content" @click.stop>
        <div class="winner-fireworks">
          <span v-for="i in 6" :key="i" class="firework" :class="`fw-${i}`">✨</span>
        </div>
        <div class="winner-crown-big">👑</div>
        <div class="winner-title">
          {{ results.length > 1 ? t('winner.split') : t('winner.winner') }}
        </div>
        <div
          v-for="result in results"
          :key="result.winnerId"
          class="winner-row"
        >
          <div class="winner-name">{{ result.winnerName }}</div>
          <div class="winner-hand-name">{{ result.handName }}</div>
          <div class="winner-hand-desc">{{ result.handDescription }}</div>
          <div class="winner-chips">+${{ result.amount.toLocaleString() }}</div>
        </div>
        <div class="dismiss-hint">{{ t('winner.dismiss') }}</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { WinResult } from '../models/index'
import { useLocale } from '../composables/useLocale'

defineProps<{
  show: boolean
  results: WinResult[]
}>()

defineEmits<{
  dismiss: []
}>()

const { t } = useLocale()
</script>

<style scoped>
.winner-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  cursor: pointer;
}

.winner-content {
  position: relative;
  background: linear-gradient(135deg, #0d1a2e 0%, #1a2d4a 50%, #0d1a2e 100%);
  border: 2px solid var(--gold);
  border-radius: 20px;
  padding: 40px 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(201, 168, 76, 0.2);
  cursor: default;
  min-width: 300px;
  max-width: 480px;
  overflow: hidden;
}

.winner-fireworks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.firework {
  position: absolute;
  font-size: 24px;
  animation: firework-burst 2s ease-in-out infinite;
}

.fw-1 { top: 10%; left: 10%; animation-delay: 0s; }
.fw-2 { top: 5%; right: 15%; animation-delay: 0.3s; }
.fw-3 { top: 30%; left: 5%; animation-delay: 0.6s; }
.fw-4 { top: 20%; right: 5%; animation-delay: 0.9s; }
.fw-5 { bottom: 20%; left: 15%; animation-delay: 0.15s; }
.fw-6 { bottom: 15%; right: 10%; animation-delay: 0.45s; }

@keyframes firework-burst {
  0%, 100% { transform: scale(0.5); opacity: 0.3; }
  50% { transform: scale(1.5); opacity: 1; }
}

.winner-crown-big {
  font-size: 56px;
  animation: crown-bounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  display: inline-block;
}

@keyframes crown-bounce {
  from { transform: translateY(-30px) scale(0.5); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.winner-title {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 4px;
  color: var(--gold);
  text-shadow: 0 0 20px rgba(201, 168, 76, 0.6);
  margin: 8px 0 20px;
  animation: title-glow 1.5s ease-in-out infinite;
}

@keyframes title-glow {
  0%, 100% { text-shadow: 0 0 10px rgba(201,168,76,0.4); }
  50% { text-shadow: 0 0 30px rgba(201,168,76,0.9), 0 0 50px rgba(201,168,76,0.4); }
}

.winner-row {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 8px;
}

.winner-name {
  font-size: 22px;
  font-weight: 800;
  color: white;
  margin-bottom: 4px;
}

.winner-hand-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--gold);
  margin-bottom: 2px;
}

.winner-hand-desc {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 10px;
}

.winner-chips {
  font-size: 28px;
  font-weight: 900;
  color: #66ff88;
  text-shadow: 0 0 15px rgba(102, 255, 136, 0.5);
}

.dismiss-hint {
  margin-top: 16px;
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 1px;
}

/* Transition */
.winner-overlay-enter-active {
  animation: overlay-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.winner-overlay-leave-active {
  animation: overlay-in 0.2s ease reverse;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.winner-overlay-enter-active .winner-content {
  animation: content-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes content-pop {
  from { transform: scale(0.8); }
  to { transform: scale(1); }
}
</style>
