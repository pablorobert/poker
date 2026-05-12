export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
  value: number // 2-14
  faceUp: boolean
}

export interface Deck {
  cards: Card[]
  usedCards: Card[]
}

export type PlayerStatus = 'active' | 'folded' | 'all-in' | 'winner' | 'thinking' | 'sitting-out'
export type PlayerType = 'human' | 'cpu'

export interface Player {
  id: string
  name: string
  chips: number
  cards: Card[]
  status: PlayerStatus
  type: PlayerType
  currentBet: number
  totalBetInRound: number
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
  seatIndex: number
  avatar: string
  winAmount?: number
  handDescription?: string
}

export type AIPersonality = 'tight' | 'loose' | 'aggressive' | 'passive' | 'balanced'
export type AIDifficulty = 'easy' | 'medium' | 'hard'

export interface AIPlayer extends Player {
  type: 'cpu'
  personality: AIPersonality
  difficulty: AIDifficulty
  aggressiveness: number // 0-1
  bluffChance: number    // 0-1
}

export type HandRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface HandEvaluation {
  rank: HandRank
  description: string
  name: string
  tiebreakers: number[]
  bestCards: Card[]
}

export type BetAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in'

export interface BetRecord {
  playerId: string
  playerName: string
  action: BetAction
  amount: number
  phase: GamePhase
  timestamp: number
}

export interface SidePot {
  amount: number
  eligiblePlayerIds: string[]
}

export interface Pot {
  main: number
  side: SidePot[]
  total: number
}

export type GamePhase = 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown' | 'end-round'

export interface RoundState {
  phase: GamePhase
  communityCards: Card[]
  pot: Pot
  currentPlayerIndex: number
  lastRaiseAmount: number
  minRaise: number
  bets: BetRecord[]
  deck: Deck
  roundNumber: number
  lastAggressorIndex: number
  actionsThisPhase: number
  playersActedThisPhase: Set<string>
}

export interface HandHistoryEntry {
  roundNumber: number
  winners: string[]
  winningHand: string
  potAmount: number
  actions: BetRecord[]
  timestamp: number
}

export interface GameSettings {
  smallBlind: number
  bigBlind: number
  startingChips: number
  playerCount: number
  humanCount: number
  soundEnabled: boolean
  animationsEnabled: boolean
}

export interface GameState {
  players: Player[]
  round: RoundState | null
  dealerIndex: number
  settings: GameSettings
  history: HandHistoryEntry[]
  gameStatus: 'lobby' | 'playing' | 'paused' | 'over'
  version: number
}

export interface ValidAction {
  action: BetAction
  minAmount?: number
  maxAmount?: number
  label?: string
}

export interface WinResult {
  winnerId: string
  winnerName: string
  amount: number
  handDescription: string
  handName: string
}
