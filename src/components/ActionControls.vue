<template>
  <Transition name="controls-slide">
    <div v-if="show" class="action-controls">
      <!-- Raise panel -->
      <Transition name="raise-expand">
        <div v-if="showRaisePanel" class="raise-panel">
          <div class="raise-presets">
            <button
              v-for="preset in raisePresets"
              :key="preset.label"
              class="preset-btn"
              @click="setRaiseAmount(preset.amount)"
            >
              {{ preset.label }}
            </button>
          </div>
          <div class="raise-input-row">
            <input
              type="range"
              :min="minRaiseAmount"
              :max="maxRaiseAmount"
              :step="bigBlind"
              v-model.number="raiseAmount"
              class="raise-slider"
            />
            <div class="raise-amount-display">
              <span class="raise-label">RAISE TO</span>
              <span class="raise-value">${{ raiseAmount }}</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Action buttons -->
      <div class="action-buttons">
        <button
          v-if="canFold"
          class="btn-action btn-fold"
          @click="handleFold"
        >
          <span class="btn-icon">✕</span>
          <span class="btn-label">Fold</span>
        </button>

        <button
          v-if="canCheck"
          class="btn-action btn-check"
          @click="handleCheck"
        >
          <span class="btn-icon">✓</span>
          <span class="btn-label">Check</span>
        </button>

        <button
          v-if="canCall"
          class="btn-action btn-call"
          @click="handleCall"
        >
          <span class="btn-icon">→</span>
          <span class="btn-label">Call</span>
          <span class="btn-amount">${{ callAmount }}</span>
        </button>

        <button
          v-if="canRaise"
          class="btn-action btn-raise"
          :class="{ active: showRaisePanel }"
          @click="toggleRaisePanel"
        >
          <span class="btn-icon">↑</span>
          <span class="btn-label">Raise</span>
          <span class="btn-amount">${{ raiseAmount }}</span>
        </button>

        <button
          v-if="showRaisePanel"
          class="btn-action btn-confirm-raise"
          @click="handleRaise"
        >
          <span class="btn-icon">✓</span>
          <span class="btn-label">Confirm</span>
        </button>

        <button
          v-if="canAllIn"
          class="btn-action btn-allin"
          @click="handleAllIn"
        >
          <span class="btn-icon">⚡</span>
          <span class="btn-label">All-In</span>
          <span class="btn-amount">${{ allInAmount }}</span>
        </button>
      </div>

      <!-- Timer bar -->
      <div v-if="show" class="timer-bar">
        <div class="timer-fill" :style="{ width: `${timerPercent}%` }"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { ValidAction, BetAction } from '../models/index'

const props = defineProps<{
  show: boolean
  validActions: ValidAction[]
  pot: number
  bigBlind: number
  playerChips: number
  maxBet: number
}>()

const emit = defineEmits<{
  action: [action: BetAction, amount?: number]
}>()

const showRaisePanel = ref(false)
const raiseAmount = ref(0)
const timerPercent = ref(100)
let timerInterval: ReturnType<typeof setInterval> | null = null
const TURN_TIME = 30

const canFold = computed(() => props.validActions.some(a => a.action === 'fold'))
const canCheck = computed(() => props.validActions.some(a => a.action === 'check'))
const canCall = computed(() => props.validActions.some(a => a.action === 'call'))
const canRaise = computed(() => props.validActions.some(a => a.action === 'raise'))
const canAllIn = computed(() => props.validActions.some(a => a.action === 'all-in'))

const callAction = computed(() => props.validActions.find(a => a.action === 'call'))
const raiseAction = computed(() => props.validActions.find(a => a.action === 'raise'))
const allInAction = computed(() => props.validActions.find(a => a.action === 'all-in'))

const callAmount = computed(() => callAction.value?.minAmount ?? 0)
const minRaiseAmount = computed(() => raiseAction.value?.minAmount ?? props.bigBlind * 2)
const maxRaiseAmount = computed(() => raiseAction.value?.maxAmount ?? props.playerChips)
const allInAmount = computed(() => allInAction.value?.minAmount ?? props.playerChips)

const raisePresets = computed(() => {
  const pot = props.pot
  const min = minRaiseAmount.value
  const max = maxRaiseAmount.value
  const presets = [
    { label: 'Min', amount: min },
    { label: '½ Pot', amount: Math.min(max, Math.max(min, Math.floor(pot / 2))) },
    { label: 'Pot', amount: Math.min(max, Math.max(min, pot)) },
    { label: '2x Pot', amount: Math.min(max, Math.max(min, pot * 2)) },
  ]
  return presets.filter((p, i, arr) =>
    p.amount <= max && arr.findIndex(x => x.amount === p.amount) === i
  )
})

// Initialize raise amount when actions change
watch(() => props.validActions, () => {
  if (canRaise.value) {
    raiseAmount.value = minRaiseAmount.value
  }
  showRaisePanel.value = false
}, { immediate: true })

// Timer
watch(() => props.show, (val) => {
  if (timerInterval) clearInterval(timerInterval)
  if (val) {
    timerPercent.value = 100
    const step = 100 / (TURN_TIME * 10)
    timerInterval = setInterval(() => {
      timerPercent.value = Math.max(0, timerPercent.value - step)
      if (timerPercent.value <= 0) {
        // Auto-fold on timeout
        handleFold()
      }
    }, 100)
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

function setRaiseAmount(amount: number): void {
  raiseAmount.value = Math.min(maxRaiseAmount.value, Math.max(minRaiseAmount.value, amount))
}

function toggleRaisePanel(): void {
  showRaisePanel.value = !showRaisePanel.value
}

function handleFold(): void {
  showRaisePanel.value = false
  emit('action', 'fold')
}

function handleCheck(): void {
  showRaisePanel.value = false
  emit('action', 'check')
}

function handleCall(): void {
  showRaisePanel.value = false
  emit('action', 'call', callAmount.value)
}

function handleRaise(): void {
  showRaisePanel.value = false
  emit('action', 'raise', raiseAmount.value)
}

function handleAllIn(): void {
  showRaisePanel.value = false
  emit('action', 'all-in', allInAmount.value)
}
</script>

<style scoped>
.action-controls {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.7);
  border-top: 1px solid rgba(201, 168, 76, 0.2);
  backdrop-filter: blur(10px);
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  min-width: 80px;
  transition: all 0.15s ease;
  font-weight: 700;
}

.btn-action:active {
  transform: scale(0.95);
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.btn-label {
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.btn-amount {
  font-size: 13px;
  font-weight: 800;
}

.btn-fold {
  background: linear-gradient(180deg, #c62828, #8b0000);
  color: white;
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.4);
}

.btn-fold:hover {
  background: linear-gradient(180deg, #e53935, #c62828);
  box-shadow: 0 6px 18px rgba(198, 40, 40, 0.6);
}

.btn-check {
  background: linear-gradient(180deg, #1565c0, #0d47a1);
  color: white;
  box-shadow: 0 4px 12px rgba(21, 101, 192, 0.4);
}

.btn-check:hover {
  background: linear-gradient(180deg, #1976d2, #1565c0);
}

.btn-call {
  background: linear-gradient(180deg, #2e7d32, #1b5e20);
  color: white;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4);
}

.btn-call:hover {
  background: linear-gradient(180deg, #388e3c, #2e7d32);
}

.btn-raise {
  background: linear-gradient(180deg, #e65100, #bf360c);
  color: white;
  box-shadow: 0 4px 12px rgba(230, 81, 0, 0.4);
}

.btn-raise:hover, .btn-raise.active {
  background: linear-gradient(180deg, #f57c00, #e65100);
  box-shadow: 0 6px 18px rgba(230, 81, 0, 0.6);
}

.btn-confirm-raise {
  background: linear-gradient(180deg, #4caf50, #2e7d32);
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5);
  animation: confirm-pulse 1s ease infinite;
}

@keyframes confirm-pulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5); }
  50% { box-shadow: 0 4px 20px rgba(76, 175, 80, 0.9); }
}

.btn-allin {
  background: linear-gradient(180deg, #f9a825, #e65100);
  color: #1a0a00;
  box-shadow: 0 4px 12px rgba(249, 168, 37, 0.4);
  font-weight: 900;
}

.btn-allin:hover {
  background: linear-gradient(180deg, #fdd835, #f9a825);
  box-shadow: 0 6px 20px rgba(249, 168, 37, 0.7);
}

/* Raise panel */
.raise-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
}

.raise-presets {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 5px 12px;
  border-radius: 16px;
  border: 1px solid rgba(201, 168, 76, 0.4);
  background: rgba(201, 168, 76, 0.1);
  color: var(--gold);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.preset-btn:hover {
  background: rgba(201, 168, 76, 0.25);
  border-color: var(--gold);
}

.raise-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.raise-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.2);
  outline: none;
  cursor: pointer;
}

.raise-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--gold);
  cursor: pointer;
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.6);
}

.raise-amount-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 70px;
}

.raise-label {
  font-size: 9px;
  color: rgba(255,255,255,0.4);
  letter-spacing: 1px;
}

.raise-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--gold);
}

/* Timer bar */
.timer-bar {
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 2px;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #c62828, var(--gold));
  border-radius: 2px;
  transition: width 0.1s linear;
}

/* Animations */
.controls-slide-enter-active {
  animation: slide-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.controls-slide-leave-active {
  animation: slide-up 0.2s ease reverse;
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.raise-expand-enter-active {
  animation: expand-down 0.25s ease;
}

.raise-expand-leave-active {
  animation: expand-down 0.2s ease reverse;
}

@keyframes expand-down {
  from { transform: scaleY(0.5); opacity: 0; transform-origin: top; }
  to { transform: scaleY(1); opacity: 1; transform-origin: top; }
}
</style>
