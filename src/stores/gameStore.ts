import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { GameState, GameSettings, BetAction, Player, ValidAction, WinResult } from '../models/index'
import {
  createGame, startRound, processAction, getValidActions,
  calculateWinners, isGameOver, serializeState, deserializeState
} from '../engine/gameEngine'
import { makeDecision } from '../ai/aiPlayer'

const STORAGE_KEY = 'poker-game-state'
const STATE_VERSION = 1

function loadFromStorage(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const state = deserializeState(raw)
    if (state.version !== STATE_VERSION) return null
    return state
  } catch {
    return null
  }
}

function saveToStorage(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state))
  } catch {
    // Storage might be full or unavailable
  }
}

function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export const useGameStore = defineStore('game', () => {
  // State
  const gameState = ref<GameState | null>(loadFromStorage())
  const aiThinking = ref(false)
  const winResults = ref<WinResult[]>([])
  const showWinner = ref(false)
  const winnerDismissTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  const pendingAITimer = ref<ReturnType<typeof setTimeout> | null>(null)

  // Persist on change
  watch(gameState, (state) => {
    if (state) saveToStorage(state)
  }, { deep: true })

  // Getters
  const currentPlayer = computed<Player | null>(() => {
    if (!gameState.value?.round) return null
    const idx = gameState.value.round.currentPlayerIndex
    return gameState.value.players[idx] ?? null
  })

  const humanPlayer = computed<Player | null>(() => {
    return gameState.value?.players.find(p => p.type === 'human') ?? null
  })

  const isHumanTurn = computed<boolean>(() => {
    if (!gameState.value?.round) return false
    const player = currentPlayer.value
    if (!player) return false
    return player.type === 'human' && player.status === 'active' && !aiThinking.value
  })

  const validActions = computed<ValidAction[]>(() => {
    if (!gameState.value || !currentPlayer.value) return []
    if (!isHumanTurn.value) return []
    return getValidActions(gameState.value, currentPlayer.value.id)
  })

  const phase = computed(() => gameState.value?.round?.phase ?? null)

  const pot = computed(() => gameState.value?.round?.pot ?? null)

  const communityCards = computed(() => gameState.value?.round?.communityCards ?? [])

  const players = computed(() => gameState.value?.players ?? [])

  const history = computed(() => gameState.value?.history ?? [])

  const gameStatus = computed(() => gameState.value?.gameStatus ?? 'lobby')

  const settings = computed(() => gameState.value?.settings ?? null)

  const dealerIndex = computed(() => gameState.value?.dealerIndex ?? 0)

  const hasSavedGame = computed(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return !!saved
  })

  const roundNumber = computed(() => gameState.value?.round?.roundNumber ?? 0)

  // Actions
  function startGame(gameSettings: GameSettings): void {
    const state = createGame(gameSettings)
    gameState.value = startRound(state)
    scheduleAIIfNeeded()
  }

  function resumeGame(): boolean {
    const saved = loadFromStorage()
    if (!saved) return false
    gameState.value = saved
    scheduleAIIfNeeded()
    return true
  }

  function playerAction(action: BetAction, amount?: number): void {
    if (!gameState.value || !isHumanTurn.value) return
    const player = currentPlayer.value
    if (!player) return

    gameState.value = processAction(gameState.value, player.id, action, amount)

    const newPhase = gameState.value.round?.phase
    if (newPhase === 'showdown') {
      handleShowdown()
    } else if (newPhase === 'end-round') {
      handleEndRound()
    } else {
      scheduleAIIfNeeded()
    }
  }

  function scheduleAIIfNeeded(): void {
    if (!gameState.value) return
    const state = gameState.value
    const round = state.round
    if (!round) return
    if (round.phase === 'showdown' || round.phase === 'end-round' || round.phase === 'waiting') return

    const player = state.players[round.currentPlayerIndex]
    if (!player || player.type !== 'cpu') return
    if (player.status !== 'active') {
      // Skip to next
      advanceToNextPlayer()
      return
    }

    aiThinking.value = true
    const decision = makeDecision(player, state)

    if (pendingAITimer.value) clearTimeout(pendingAITimer.value)

    pendingAITimer.value = setTimeout(() => {
      if (!gameState.value) return
      aiThinking.value = false

      // Update player status to remove 'thinking'
      const currentState = gameState.value

      const newState = processAction(
        currentState,
        player.id,
        decision.action,
        decision.amount
      )
      gameState.value = newState

      const newPhase = gameState.value.round?.phase
      if (newPhase === 'showdown') {
        handleShowdown()
      } else if (newPhase === 'end-round') {
        handleEndRound()
      } else {
        scheduleAIIfNeeded()
      }
    }, decision.thinkingMs)
  }

  function advanceToNextPlayer(): void {
    // Try to advance if current player can't act
    scheduleAIIfNeeded()
  }

  function handleShowdown(): void {
    if (!gameState.value) return
    const results = calculateWinners(gameState.value)
    winResults.value = results
    showWinner.value = true

    if (winnerDismissTimer.value) clearTimeout(winnerDismissTimer.value)
    winnerDismissTimer.value = setTimeout(() => {
      dismissWinner()
    }, 4000)
  }

  function handleEndRound(): void {
    scheduleNextRound()
  }

  function dismissWinner(): void {
    showWinner.value = false
    if (winnerDismissTimer.value) clearTimeout(winnerDismissTimer.value)
    scheduleNextRound()
  }

  function scheduleNextRound(): void {
    if (!gameState.value) return

    if (isGameOver(gameState.value)) {
      gameState.value = { ...gameState.value, gameStatus: 'over' }
      return
    }

    // Short delay before next round
    setTimeout(() => {
      if (!gameState.value) return
      gameState.value = startRound(gameState.value)
      scheduleAIIfNeeded()
    }, 1500)
  }

  function nextRound(): void {
    if (!gameState.value) return
    showWinner.value = false
    if (winnerDismissTimer.value) clearTimeout(winnerDismissTimer.value)
    if (pendingAITimer.value) clearTimeout(pendingAITimer.value)
    gameState.value = startRound(gameState.value)
    scheduleAIIfNeeded()
  }

  function resetGame(): void {
    if (pendingAITimer.value) clearTimeout(pendingAITimer.value)
    if (winnerDismissTimer.value) clearTimeout(winnerDismissTimer.value)
    clearStorage()
    gameState.value = null
    aiThinking.value = false
    showWinner.value = false
    winResults.value = []
  }

  function toggleSound(): void {
    if (!gameState.value) return
    gameState.value = {
      ...gameState.value,
      settings: {
        ...gameState.value.settings,
        soundEnabled: !gameState.value.settings.soundEnabled
      }
    }
  }

  return {
    // State
    gameState,
    aiThinking,
    winResults,
    showWinner,
    // Getters
    currentPlayer,
    humanPlayer,
    isHumanTurn,
    validActions,
    phase,
    pot,
    communityCards,
    players,
    history,
    gameStatus,
    settings,
    dealerIndex,
    hasSavedGame,
    roundNumber,
    // Actions
    startGame,
    resumeGame,
    playerAction,
    nextRound,
    resetGame,
    dismissWinner,
    toggleSound
  }
})
