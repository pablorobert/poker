<template>
  <div class="game-view">
    <!-- Top bar -->
    <header class="game-header">
      <div class="header-left">
        <button class="btn-icon-sm" @click="showMenu = !showMenu" title="Menu">
          ☰
        </button>
        <span class="game-title">♠ ROYAL POKER</span>
      </div>
      <div class="header-right">
        <div v-if="humanPlayer" class="player-chips-display">
          <span class="chips-label">{{ t('game.yourChips') }}</span>
          <span class="chips-value" :class="{ 'chips-low': (humanPlayer.chips ?? 0) < (settings?.bigBlind ?? 10) * 5 }">
            ${{ (humanPlayer.chips ?? 0).toLocaleString() }}
          </span>
        </div>
        <SoundToggle :enabled="settings?.soundEnabled ?? true" @toggle="store.toggleSound()" />
      </div>
    </header>

    <!-- Menu dropdown -->
    <Transition name="menu-drop">
      <div v-if="showMenu" class="game-menu" @click.stop>
        <button class="menu-item" @click="handleNewGame">{{ t('game.newGame') }}</button>
        <button class="menu-item" @click="handleQuit">{{ t('game.quitLobby') }}</button>
        <div class="menu-divider"></div>
        <div class="menu-info">{{ t('game.round') }} {{ roundNumber }} · {{ phaseLabel }}</div>
      </div>
    </Transition>
    <div v-if="showMenu" class="menu-backdrop" @click="showMenu = false"></div>

    <!-- Main game area -->
    <main class="game-main">
      <!-- Poker table -->
      <div class="table-area">
        <PokerTable
          v-if="players.length > 0"
          :players="players"
          :community-cards="communityCards"
          :phase="phase"
          :pot="pot"
          :current-player-index="currentPlayerIndex"
          :round-number="roundNumber"
        />
        <div v-else class="loading-table">
          <div class="loading-spinner"></div>
          <span>Dealing cards...</span>
        </div>
      </div>

      <!-- Game log sidebar -->
      <GameLog
        :recent-bets="recentBets"
        :history="history"
      />
    </main>

    <!-- Action controls -->
    <ActionControls
      :show="isHumanTurn && !showWinner"
      :valid-actions="validActions"
      :pot="pot?.total ?? 0"
      :big-blind="settings?.bigBlind ?? 10"
      :player-chips="humanPlayer?.chips ?? 0"
      :max-bet="maxBet"
      @action="handleAction"
    />

    <!-- AI thinking indicator -->
    <Transition name="fade">
      <div v-if="isAITurn" class="ai-thinking-bar">
        <span class="thinking-name">{{ currentPlayer?.name }}</span>
        <span class="thinking-text">{{ t('ai.thinking') }}</span>
        <span class="thinking-dots-bar">
          <span></span><span></span><span></span>
        </span>
      </div>
    </Transition>

    <!-- Winner overlay -->
    <WinnerOverlay
      :show="showWinner"
      :results="winResults"
      @dismiss="store.dismissWinner()"
    />

    <!-- Game over screen -->
    <Transition name="fade">
      <div v-if="gameStatus === 'over'" class="game-over-overlay">
        <div class="game-over-content">
          <div class="game-over-icon">🃏</div>
          <div class="game-over-title">{{ t('gameover.title') }}</div>
          <div class="game-over-sub">
            {{ humanPlayer && humanPlayer.chips > 0 ? t('gameover.win') : t('gameover.lose') }}
          </div>
          <button class="btn-play-again" @click="handleQuit">
            {{ t('gameover.playAgain') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useSound } from '../composables/useSound'
import { useLocale } from '../composables/useLocale'
import type { BetAction } from '../models/index'
import PokerTable from '../components/PokerTable.vue'
import ActionControls from '../components/ActionControls.vue'
import GameLog from '../components/GameLog.vue'
import WinnerOverlay from '../components/WinnerOverlay.vue'
import SoundToggle from '../components/SoundToggle.vue'

const router = useRouter()
const store = useGameStore()
const { playSound } = useSound()
const { t } = useLocale()

const showMenu = ref(false)

const players = computed(() => store.players)
const communityCards = computed(() => store.communityCards)
const phase = computed(() => store.phase)
const pot = computed(() => store.pot)
const currentPlayer = computed(() => store.currentPlayer)
const humanPlayer = computed(() => store.humanPlayer)
const isHumanTurn = computed(() => store.isHumanTurn)
const validActions = computed(() => store.validActions)
const history = computed(() => store.history)
const gameStatus = computed(() => store.gameStatus)
const settings = computed(() => store.settings)
const roundNumber = computed(() => store.roundNumber)
const showWinner = computed(() => store.showWinner)
const winResults = computed(() => store.winResults)

const isAITurn = computed(() =>
  store.aiThinking && currentPlayer.value?.type === 'cpu'
)

const currentPlayerIndex = computed(() =>
  store.gameState?.round?.currentPlayerIndex ?? 0
)

const maxBet = computed(() =>
  Math.max(...players.value.map(p => p.currentBet), 0)
)

const recentBets = computed(() =>
  store.gameState?.round?.bets ?? []
)

const phaseLabel = computed(() => {
  const key = `phase.${phase.value ?? 'waiting'}` as Parameters<typeof t>[0]
  return t(key)
})

// Sound effects
watch(communityCards, (newCards, oldCards) => {
  if (newCards.length > (oldCards?.length ?? 0)) {
    playSound('card')
  }
})

watch(showWinner, (val) => {
  if (val) playSound('win')
})

watch(isAITurn, (val) => {
  // No specific sound for AI thinking
  void val
})

// Redirect to lobby if no game state
watch(() => store.gameState, (state) => {
  if (!state) router.push('/')
}, { immediate: true })

function handleAction(action: BetAction, amount?: number): void {
  switch (action) {
    case 'fold': playSound('fold'); break
    case 'check': playSound('check'); break
    case 'call': playSound('chip'); break
    case 'raise': playSound('raise'); break
    case 'all-in': playSound('allin'); break
  }
  store.playerAction(action, amount)
  showMenu.value = false
}

function handleNewGame(): void {
  showMenu.value = false
  store.resetGame()
  router.push('/')
}

function handleQuit(): void {
  showMenu.value = false
  store.resetGame()
  router.push('/')
}
</script>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-dark);
  overflow: hidden;
  position: relative;
}

/* Header */
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(0,0,0,0.4);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-icon-sm {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.7);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-icon-sm:hover {
  background: rgba(255,255,255,0.12);
}

.game-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 3px;
  color: var(--gold);
  text-shadow: 0 0 10px rgba(201,168,76,0.4);
}

.player-chips-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.chips-label {
  font-size: 9px;
  letter-spacing: 1.5px;
  color: rgba(255,255,255,0.3);
}

.chips-value {
  font-size: 16px;
  font-weight: 800;
  color: var(--gold);
}

.chips-low {
  color: #ff6b6b;
  animation: low-chips-blink 1s ease-in-out infinite;
}

@keyframes low-chips-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Menu */
.game-menu {
  position: absolute;
  top: 52px;
  left: 10px;
  background: rgba(10, 15, 25, 0.95);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 6px;
  min-width: 180px;
  z-index: 50;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  backdrop-filter: blur(10px);
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.8);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}

.menu-item:hover {
  background: rgba(255,255,255,0.08);
}

.menu-divider {
  height: 1px;
  background: rgba(255,255,255,0.08);
  margin: 4px 0;
}

.menu-info {
  padding: 6px 12px;
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 1px;
}

/* Main */
.game-main {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.table-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
}

.loading-table {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255,255,255,0.4);
  font-size: 14px;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* AI thinking bar */
.ai-thinking-bar {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,0,0,0.7);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  backdrop-filter: blur(4px);
  z-index: 20;
  pointer-events: none;
}

.thinking-name {
  font-weight: 700;
  color: white;
}

.thinking-dots-bar {
  display: flex;
  gap: 3px;
}

.thinking-dots-bar span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold);
  animation: dot-bounce 1.2s infinite;
}

.thinking-dots-bar span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots-bar span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-5px); opacity: 1; }
}

/* Game over overlay */
.game-over-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(6px);
}

.game-over-content {
  text-align: center;
  padding: 40px;
}

.game-over-icon {
  font-size: 72px;
  margin-bottom: 16px;
}

.game-over-title {
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 6px;
  color: var(--gold);
  text-shadow: 0 0 30px rgba(201, 168, 76, 0.5);
  margin-bottom: 12px;
}

.game-over-sub {
  font-size: 20px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 32px;
}

.btn-play-again {
  padding: 14px 40px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #c9a84c, #f0d080);
  color: #1a0a00;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 2px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(201, 168, 76, 0.4);
}

.btn-play-again:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(201, 168, 76, 0.6);
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.menu-drop-enter-active {
  animation: menu-down 0.2s ease;
}
.menu-drop-leave-active {
  animation: menu-down 0.15s ease reverse;
}
@keyframes menu-down {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
