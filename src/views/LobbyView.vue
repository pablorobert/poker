<template>
  <div class="lobby">
    <!-- Background decorations -->
    <div class="lobby-bg">
      <div class="bg-card bg-card-1">♠</div>
      <div class="bg-card bg-card-2">♥</div>
      <div class="bg-card bg-card-3">♦</div>
      <div class="bg-card bg-card-4">♣</div>
    </div>

    <div class="lobby-container">
      <!-- Logo -->
      <div class="lobby-logo">
        <div class="logo-suit">♠</div>
        <div class="logo-text">
          <span class="logo-main">ROYAL</span>
          <span class="logo-sub">POKER</span>
        </div>
        <div class="logo-suit logo-suit-r">♠</div>
      </div>

      <!-- Resume game button -->
      <div v-if="hasSavedGame" class="resume-section">
        <button class="btn-resume" @click="handleResume">
          <span>↩</span>
          Resume Saved Game
        </button>
      </div>

      <!-- Setup form -->
      <div class="setup-card">
        <h2 class="setup-title">New Game</h2>

        <!-- Player name -->
        <div class="form-group">
          <label class="form-label">Your Name</label>
          <input
            v-model="playerName"
            type="text"
            class="form-input"
            placeholder="Enter your name"
            maxlength="14"
            @keyup.enter="handleStart"
          />
        </div>

        <!-- CPU Count -->
        <div class="form-group">
          <label class="form-label">Opponents</label>
          <div class="option-group">
            <button
              v-for="n in [1, 2, 3]"
              :key="n"
              class="option-btn"
              :class="{ active: cpuCount === n }"
              @click="cpuCount = n"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <!-- Starting chips -->
        <div class="form-group">
          <label class="form-label">Starting Chips</label>
          <div class="option-group">
            <button
              v-for="chips in [500, 1000, 2000, 5000]"
              :key="chips"
              class="option-btn"
              :class="{ active: startingChips === chips }"
              @click="startingChips = chips"
            >
              ${{ chips >= 1000 ? `${chips/1000}k` : chips }}
            </button>
          </div>
        </div>

        <!-- Blinds -->
        <div class="form-group">
          <label class="form-label">Blinds</label>
          <div class="option-group">
            <button
              v-for="blind in blindOptions"
              :key="blind.sb"
              class="option-btn"
              :class="{ active: smallBlind === blind.sb }"
              @click="smallBlind = blind.sb; bigBlind = blind.bb"
            >
              ${{ blind.sb }}/${{ blind.bb }}
            </button>
          </div>
        </div>

        <!-- Deal button -->
        <button class="btn-deal" @click="handleStart">
          <span class="deal-icon">🃏</span>
          DEAL ME IN
        </button>
      </div>

      <!-- Quick rules -->
      <div class="quick-rules">
        <span>Texas Hold'em · No Limit · {{ cpuCount + 1 }}-Player</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import type { GameSettings } from '../models/index'

const router = useRouter()
const store = useGameStore()

const playerName = ref('Player 1')
const cpuCount = ref(2)
const startingChips = ref(1000)
const smallBlind = ref(5)
const bigBlind = ref(10)

const blindOptions = [
  { sb: 1, bb: 2 },
  { sb: 5, bb: 10 },
  { sb: 10, bb: 20 },
  { sb: 25, bb: 50 },
]

const hasSavedGame = computed(() => store.hasSavedGame)

function handleStart(): void {
  const settings: GameSettings = {
    smallBlind: smallBlind.value,
    bigBlind: bigBlind.value,
    startingChips: startingChips.value,
    playerCount: cpuCount.value + 1,
    humanCount: 1,
    soundEnabled: true,
    animationsEnabled: true
  }
  store.resetGame()
  store.startGame(settings)
  // Set player name
  if (store.gameState && playerName.value.trim()) {
    const humanIdx = store.gameState.players.findIndex(p => p.type === 'human')
    if (humanIdx !== -1) {
      store.gameState.players[humanIdx].name = playerName.value.trim()
    }
  }
  router.push('/game')
}

function handleResume(): void {
  const ok = store.resumeGame()
  if (ok) router.push('/game')
}
</script>

<style scoped>
.lobby {
  min-height: 100vh;
  background: var(--bg-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.lobby-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-card {
  position: absolute;
  font-size: 200px;
  opacity: 0.03;
  font-weight: 900;
  user-select: none;
  animation: float-card 6s ease-in-out infinite;
}

.bg-card-1 { top: -50px; left: -30px; color: #fff; animation-delay: 0s; }
.bg-card-2 { top: -30px; right: -20px; color: #c62828; animation-delay: 1.5s; }
.bg-card-3 { bottom: -60px; left: 10%; color: #c62828; animation-delay: 3s; }
.bg-card-4 { bottom: -40px; right: 5%; color: #fff; animation-delay: 4.5s; }

@keyframes float-card {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
}

.lobby-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px;
  width: 100%;
  max-width: 440px;
}

/* Logo */
.lobby-logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-suit {
  font-size: 48px;
  color: var(--gold);
  text-shadow: 0 0 20px rgba(201, 168, 76, 0.6);
  animation: suit-pulse 2s ease-in-out infinite;
}

.logo-suit-r {
  animation-delay: 1s;
}

@keyframes suit-pulse {
  0%, 100% { text-shadow: 0 0 10px rgba(201, 168, 76, 0.4); }
  50% { text-shadow: 0 0 30px rgba(201, 168, 76, 0.9); }
}

.logo-text {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-main {
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 8px;
  color: var(--gold);
  text-shadow: 0 0 20px rgba(201, 168, 76, 0.4);
  line-height: 1;
}

.logo-sub {
  font-size: 14px;
  letter-spacing: 14px;
  color: rgba(255,255,255,0.4);
  font-weight: 600;
  text-transform: uppercase;
  margin-left: 4px;
}

/* Resume */
.resume-section {
  width: 100%;
}

.btn-resume {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  border: 2px solid rgba(201, 168, 76, 0.4);
  background: rgba(201, 168, 76, 0.1);
  color: var(--gold);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}

.btn-resume:hover {
  background: rgba(201, 168, 76, 0.2);
  border-color: var(--gold);
}

/* Setup card */
.setup-card {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
}

.setup-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  margin-bottom: 20px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.3);
  color: white;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: rgba(201, 168, 76, 0.5);
}

.option-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.option-btn {
  flex: 1;
  min-width: 50px;
  padding: 8px 4px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.6);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  text-align: center;
}

.option-btn:hover {
  border-color: rgba(201, 168, 76, 0.4);
  color: var(--gold);
}

.option-btn.active {
  background: rgba(201, 168, 76, 0.2);
  border-color: var(--gold);
  color: var(--gold);
}

/* Deal button */
.btn-deal {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  margin-top: 8px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #c9a84c 0%, #f0d080 50%, #c9a84c 100%);
  color: #1a0a00;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 3px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(201, 168, 76, 0.4);
}

.btn-deal:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(201, 168, 76, 0.6);
}

.btn-deal:active {
  transform: translateY(0);
}

.deal-icon {
  font-size: 22px;
}

/* Quick rules */
.quick-rules {
  font-size: 11px;
  color: rgba(255,255,255,0.2);
  letter-spacing: 1px;
}
</style>
