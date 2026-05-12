import type {
  GameState, Player, RoundState, BetAction,
  BetRecord, GamePhase, GameSettings,
  Pot, SidePot, ValidAction, WinResult, HandHistoryEntry
} from '../models/index'
import { createDeck, dealFaceDown, dealCards, burnCard } from './deck'
import { evaluateHand, compareHandEvals } from './handEvaluator'

const STATE_VERSION = 1

export function createGame(settings: GameSettings): GameState {
  const players: Player[] = []
  const avatars = ['🦁', '🐯', '🦊', '🐺', '🦅', '🐻', '🐴', '🦋']
  const cpuNames = ['Apollo', 'Blaze', 'Cipher', 'Dagger', 'Echo', 'Frost', 'Ghost']

  // Human player first
  players.push({
    id: 'human-0',
    name: 'You',
    chips: settings.startingChips,
    cards: [],
    status: 'active',
    type: 'human',
    currentBet: 0,
    totalBetInRound: 0,
    isDealer: false,
    isSmallBlind: false,
    isBigBlind: false,
    seatIndex: 0,
    avatar: '😎'
  })

  // CPU players
  const cpuCount = settings.playerCount - 1
  for (let i = 0; i < cpuCount; i++) {
    players.push({
      id: `cpu-${i}`,
      name: cpuNames[i % cpuNames.length],
      chips: settings.startingChips,
      cards: [],
      status: 'active',
      type: 'cpu',
      currentBet: 0,
      totalBetInRound: 0,
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
      seatIndex: i + 1,
      avatar: avatars[i % avatars.length]
    })
  }

  return {
    players,
    round: null,
    dealerIndex: 0,
    settings,
    history: [],
    gameStatus: 'playing',
    version: STATE_VERSION
  }
}

export function startRound(state: GameState): GameState {
  const activePlayers = state.players.filter(p => p.chips > 0)
  if (activePlayers.length < 2) {
    return { ...state, gameStatus: 'over' }
  }

  // Reset players
  let players: Player[] = state.players.map(p => ({
    ...p,
    cards: [],
    currentBet: 0,
    totalBetInRound: 0,
    isDealer: false,
    isSmallBlind: false,
    isBigBlind: false,
    status: (p.chips > 0 ? 'active' : 'sitting-out') as Player['status'],
    winAmount: undefined,
    handDescription: undefined
  }))

  // Find eligible players (have chips)
  const eligibleIndices = players
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.chips > 0)
    .map(({ i }) => i)

  if (eligibleIndices.length < 2) {
    return { ...state, players, gameStatus: 'over' }
  }

  // Rotate dealer to next eligible player
  let dealerIndex = state.dealerIndex
  // Find next eligible dealer
  let dealerSearchCount = 0
  do {
    dealerIndex = (dealerIndex + 1) % players.length
    dealerSearchCount++
  } while (players[dealerIndex].chips === 0 && dealerSearchCount < players.length)

  // Assign dealer/SB/BB positions
  const eligible = eligibleIndices
  const dealerPos = eligible.indexOf(dealerIndex)

  let sbIndex: number
  let bbIndex: number

  if (eligible.length === 2) {
    // Heads up: dealer is SB
    sbIndex = dealerIndex
    bbIndex = eligible[(eligible.indexOf(dealerIndex) + 1) % eligible.length]
  } else {
    sbIndex = eligible[(dealerPos + 1) % eligible.length]
    bbIndex = eligible[(dealerPos + 2) % eligible.length]
  }

  players = players.map((p, i) => ({
    ...p,
    isDealer: i === dealerIndex,
    isSmallBlind: i === sbIndex,
    isBigBlind: i === bbIndex
  }))

  // Deal hole cards
  let deck = createDeck()
  // Deal 2 cards to each eligible player (deal one at a time like real poker)
  for (let round = 0; round < 2; round++) {
    for (const idx of eligible) {
      const result = dealFaceDown(deck, 1)
      players = players.map((p, i) =>
        i === idx ? { ...p, cards: [...p.cards, ...result.cards] } : p
      )
      deck = result.deck
    }
  }

  // Human cards face up
  players = players.map(p => ({
    ...p,
    cards: p.type === 'human'
      ? p.cards.map(c => ({ ...c, faceUp: true }))
      : p.cards
  }))

  // Post blinds
  const { bigBlind, smallBlind } = state.settings
  const sbPlayer = players[sbIndex]
  const bbPlayer = players[bbIndex]

  const sbAmount = Math.min(smallBlind, sbPlayer.chips)
  const bbAmount = Math.min(bigBlind, bbPlayer.chips)

  const bets: BetRecord[] = []

  players = players.map((p, i) => {
    if (i === sbIndex) {
      const amt = Math.min(smallBlind, p.chips)
      bets.push({
        playerId: p.id, playerName: p.name,
        action: 'call', amount: amt,
        phase: 'pre-flop', timestamp: Date.now()
      })
      return {
        ...p,
        chips: p.chips - amt,
        currentBet: amt,
        totalBetInRound: amt,
        status: p.chips - amt === 0 ? ('all-in' as const) : p.status
      }
    }
    if (i === bbIndex) {
      const amt = Math.min(bigBlind, p.chips)
      bets.push({
        playerId: p.id, playerName: p.name,
        action: 'call', amount: amt,
        phase: 'pre-flop', timestamp: Date.now()
      })
      return {
        ...p,
        chips: p.chips - amt,
        currentBet: amt,
        totalBetInRound: amt,
        status: p.chips - amt === 0 ? ('all-in' as const) : p.status
      }
    }
    return p
  })

  // First to act pre-flop is after BB
  const bbPos = eligible.indexOf(bbIndex)
  let firstToAct: number

  if (eligible.length === 2) {
    // Heads up: dealer/SB acts first pre-flop
    firstToAct = sbIndex
  } else {
    firstToAct = eligible[(bbPos + 1) % eligible.length]
  }

  const pot: Pot = {
    main: sbAmount + bbAmount,
    side: [],
    total: sbAmount + bbAmount
  }

  const round: RoundState = {
    phase: 'pre-flop',
    communityCards: [],
    pot,
    currentPlayerIndex: firstToAct,
    lastRaiseAmount: bigBlind,
    minRaise: bigBlind,
    bets,
    deck,
    roundNumber: (state.round?.roundNumber ?? 0) + 1,
    lastAggressorIndex: bbIndex,
    actionsThisPhase: 0,
    playersActedThisPhase: new Set<string>()
  }

  return {
    ...state,
    players,
    round,
    dealerIndex,
    gameStatus: 'playing'
  }
}

export function getValidActions(state: GameState, playerId: string): ValidAction[] {
  const { round, players } = state
  if (!round || round.phase === 'showdown' || round.phase === 'end-round') return []

  const player = players.find(p => p.id === playerId)
  if (!player || player.status === 'folded' || player.status === 'all-in' || player.status === 'sitting-out') return []

  const currentIdx = players.indexOf(player)
  if (currentIdx !== round.currentPlayerIndex) return []

  const maxBet = Math.max(...players.map(p => p.currentBet))
  const toCall = maxBet - player.currentBet
  const actions: ValidAction[] = []

  // Fold (always available)
  actions.push({ action: 'fold', label: 'Fold' })

  // Check or Call
  if (toCall === 0) {
    actions.push({ action: 'check', label: 'Check' })
  } else if (toCall >= player.chips) {
    // All-in call
    actions.push({ action: 'all-in', minAmount: player.chips, maxAmount: player.chips, label: `All-In $${player.chips}` })
  } else {
    actions.push({ action: 'call', minAmount: toCall, maxAmount: toCall, label: `Call $${toCall}` })
  }

  // Raise (if player has enough chips)
  const minRaise = round.minRaise
  const minRaiseTotal = maxBet + minRaise
  const raiseAdditional = minRaiseTotal - player.currentBet

  if (player.chips > toCall) {
    if (player.chips <= raiseAdditional) {
      // Only all-in raise possible
      if (!actions.some(a => a.action === 'all-in')) {
        actions.push({
          action: 'all-in',
          minAmount: player.chips,
          maxAmount: player.chips,
          label: `All-In $${player.chips}`
        })
      }
    } else {
      actions.push({
        action: 'raise',
        minAmount: raiseAdditional,
        maxAmount: player.chips,
        label: `Raise`
      })
      // All-in as separate option
      if (!actions.some(a => a.action === 'all-in')) {
        actions.push({
          action: 'all-in',
          minAmount: player.chips,
          maxAmount: player.chips,
          label: `All-In $${player.chips}`
        })
      }
    }
  }

  return actions
}

export function validateAction(
  state: GameState,
  playerId: string,
  action: BetAction,
  amount?: number
): boolean {
  const valid = getValidActions(state, playerId)
  const found = valid.find(v => v.action === action)
  if (!found) return false
  if ((action === 'raise') && amount !== undefined) {
    const min = found.minAmount ?? 0
    const max = found.maxAmount ?? Infinity
    return amount >= min && amount <= max
  }
  return true
}

export function processAction(
  state: GameState,
  playerId: string,
  action: BetAction,
  amount?: number
): GameState {
  if (!validateAction(state, playerId, action, amount)) {
    return state
  }

  const { round } = state
  if (!round) return state

  let players = [...state.players]
  const playerIdx = players.findIndex(p => p.id === playerId)
  if (playerIdx === -1) return state

  const player = { ...players[playerIdx] }
  const maxBet = Math.max(...players.map(p => p.currentBet))
  const toCall = maxBet - player.currentBet
  let pot = { ...round.pot, side: [...round.pot.side] }
  const bets = [...round.bets]
  let lastRaiseAmount = round.lastRaiseAmount
  let minRaise = round.minRaise
  let lastAggressorIndex = round.lastAggressorIndex
  let betAmount = 0

  const betRecord: BetRecord = {
    playerId: player.id,
    playerName: player.name,
    action,
    amount: 0,
    phase: round.phase,
    timestamp: Date.now()
  }

  switch (action) {
    case 'fold':
      player.status = 'folded'
      betRecord.amount = 0
      break

    case 'check':
      betRecord.amount = 0
      break

    case 'call': {
      const callAmount = Math.min(toCall, player.chips)
      player.chips -= callAmount
      player.currentBet += callAmount
      player.totalBetInRound += callAmount
      pot.main += callAmount
      pot.total += callAmount
      betAmount = callAmount
      betRecord.amount = callAmount
      if (player.chips === 0) player.status = 'all-in'
      break
    }

    case 'raise': {
      const raiseAmount = amount ?? (round.minRaise + toCall)
      const actual = Math.min(raiseAmount, player.chips)
      lastRaiseAmount = actual - toCall
      minRaise = lastRaiseAmount
      player.chips -= actual
      player.currentBet += actual
      player.totalBetInRound += actual
      pot.main += actual
      pot.total += actual
      betAmount = actual
      betRecord.amount = actual
      lastAggressorIndex = playerIdx
      if (player.chips === 0) player.status = 'all-in'
      break
    }

    case 'all-in': {
      const allInAmount = player.chips
      const prevBet = player.currentBet
      const raise = (prevBet + allInAmount) - maxBet
      if (raise > 0 && raise > lastRaiseAmount) {
        lastRaiseAmount = raise
        minRaise = raise
        lastAggressorIndex = playerIdx
      }
      player.currentBet += allInAmount
      player.totalBetInRound += allInAmount
      pot.main += allInAmount
      pot.total += allInAmount
      betAmount = allInAmount
      betRecord.amount = allInAmount
      player.chips = 0
      player.status = 'all-in'
      break
    }
  }

  betRecord.amount = betAmount
  bets.push(betRecord)

  players = players.map((p, i) => i === playerIdx ? player : p)

  // Recalculate side pots if someone is all-in
  pot = recalculatePot(players, pot)

  const playersActedThisPhase = new Set(round.playersActedThisPhase)
  playersActedThisPhase.add(playerId)

  const updatedRound: RoundState = {
    ...round,
    pot,
    bets,
    lastRaiseAmount,
    minRaise,
    lastAggressorIndex,
    actionsThisPhase: round.actionsThisPhase + 1,
    playersActedThisPhase
  }

  let newState: GameState = { ...state, players, round: updatedRound }

  // Check if betting round is over
  if (isBettingRoundOver(newState)) {
    newState = advancePhase(newState)
  } else {
    // Move to next active player
    newState = { ...newState, round: { ...newState.round!, currentPlayerIndex: nextActivePlayer(players, playerIdx) } }
  }

  return newState
}

function recalculatePot(players: Player[], pot: Pot): Pot {
  const allInPlayers = players.filter(p => p.status === 'all-in')
  if (allInPlayers.length === 0) return pot

  // Simple side pot calculation
  const side: SidePot[] = []
  const allInAmounts = allInPlayers
    .map(p => p.totalBetInRound)
    .sort((a, b) => a - b)

  // For simplicity, just track side pots by eligible players
  let prev = 0
  for (const allinAmt of allInAmounts) {
    if (allinAmt <= prev) continue
    const eligible = players
      .filter(p => p.status !== 'folded' && p.totalBetInRound >= allinAmt)
      .map(p => p.id)
    if (eligible.length > 1) {
      side.push({ amount: 0, eligiblePlayerIds: eligible })
    }
    prev = allinAmt
  }

  return { ...pot, side }
}

function isBettingRoundOver(state: GameState): boolean {
  const { round, players } = state
  if (!round) return false

  const nonFolded = players.filter(p => p.status !== 'folded' && p.status !== 'sitting-out')
  if (nonFolded.length <= 1) return true

  const activePlayers = players.filter(p => p.status === 'active' && p.chips > 0)
  if (activePlayers.length === 0) return true

  const maxBet = Math.max(...nonFolded.map(p => p.currentBet), 0)

  return activePlayers.every(p =>
    p.currentBet === maxBet && round.playersActedThisPhase.has(p.id)
  )
}

function nextActivePlayer(players: Player[], fromIndex: number): number {
  const n = players.length
  let idx = (fromIndex + 1) % n
  let count = 0
  while (count < n) {
    const p = players[idx]
    if (p.status === 'active' && p.chips > 0) return idx
    idx = (idx + 1) % n
    count++
  }
  return fromIndex
}

export function advancePhase(state: GameState): GameState {
  const { round, players } = state
  if (!round) return state

  const activePlayers = players.filter(p => p.status !== 'folded' && p.status !== 'sitting-out')

  // If only 1 player remains (all others folded)
  const nonFolded = players.filter(p => p.status !== 'folded' && p.status !== 'sitting-out')
  if (nonFolded.length === 1) {
    return resolveRound(state, true)
  }

  // All remaining players are all-in (auto-run board)
  const canBet = activePlayers.filter(p => p.status === 'active' && p.chips > 0)
  if (canBet.length <= 1 && round.phase !== 'river') {
    // Run remaining streets without betting
    return runRemainingStreets(state)
  }

  const phaseOrder: GamePhase[] = ['pre-flop', 'flop', 'turn', 'river', 'showdown']
  const currentIdx = phaseOrder.indexOf(round.phase)
  const nextPhase = phaseOrder[currentIdx + 1] ?? 'showdown'

  if (nextPhase === 'showdown') {
    return resolveRound(state, false)
  }

  let deck = round.deck
  let communityCards = [...round.communityCards]

  // Burn and deal community cards
  deck = burnCard(deck)

  if (nextPhase === 'flop') {
    const result = dealCards(deck, 3)
    communityCards = [...communityCards, ...result.cards]
    deck = result.deck
  } else if (nextPhase === 'turn' || nextPhase === 'river') {
    const result = dealCards(deck, 1)
    communityCards = [...communityCards, ...result.cards]
    deck = result.deck
  }

  // Reset bets for new phase
  const resetPlayers = players.map(p => ({
    ...p,
    currentBet: 0,
    status: p.status === 'winner' ? ('active' as const) : p.status
  }))

  // First to act post-flop: first active player after dealer
  const dealerIdx = state.dealerIndex
  const eligibleForAction = resetPlayers
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.status === 'active' && p.chips > 0)

  let firstToAct = dealerIdx
  if (eligibleForAction.length > 0) {
    // Find first active player after dealer
    let searchIdx = (dealerIdx + 1) % resetPlayers.length
    for (let i = 0; i < resetPlayers.length; i++) {
      const p = resetPlayers[searchIdx]
      if (p.status === 'active' && p.chips > 0) {
        firstToAct = searchIdx
        break
      }
      searchIdx = (searchIdx + 1) % resetPlayers.length
    }
  }

  return {
    ...state,
    players: resetPlayers,
    round: {
      ...round,
      phase: nextPhase,
      communityCards,
      deck,
      currentPlayerIndex: firstToAct,
      lastRaiseAmount: state.settings.bigBlind,
      minRaise: state.settings.bigBlind,
      actionsThisPhase: 0,
      playersActedThisPhase: new Set<string>()
    }
  }
}

function runRemainingStreets(state: GameState): GameState {
  let current = state
  const phases: GamePhase[] = ['flop', 'turn', 'river']
  const round = current.round
  if (!round) return current

  const startIdx = phases.indexOf(round.phase as 'flop' | 'turn' | 'river')

  for (let i = startIdx === -1 ? 0 : startIdx; i < phases.length; i++) {
    if (current.round!.phase === phases[i] || (i === 0 && current.round!.phase === 'pre-flop')) {
      // Deal cards for this phase
      let deck = current.round!.deck
      let communityCards = [...current.round!.communityCards]
      deck = burnCard(deck)

      if (phases[i] === 'flop' && communityCards.length < 3) {
        const r = dealCards(deck, 3)
        communityCards = [...communityCards, ...r.cards]
        deck = r.deck
      } else if (phases[i] === 'turn' && communityCards.length < 4) {
        const r = dealCards(deck, 1)
        communityCards = [...communityCards, ...r.cards]
        deck = r.deck
      } else if (phases[i] === 'river' && communityCards.length < 5) {
        const r = dealCards(deck, 1)
        communityCards = [...communityCards, ...r.cards]
        deck = r.deck
      }

      current = {
        ...current,
        round: { ...current.round!, phase: phases[i], communityCards, deck }
      }
    }
  }

  // Ensure we have 5 community cards
  let deck = current.round!.deck
  let communityCards = [...current.round!.communityCards]

  while (communityCards.length < 5) {
    deck = burnCard(deck)
    const r = dealCards(deck, 1)
    communityCards = [...communityCards, ...r.cards]
    deck = r.deck
  }

  current = {
    ...current,
    round: { ...current.round!, phase: 'river', communityCards, deck }
  }

  return resolveRound(current, false)
}

export function calculateWinners(state: GameState): WinResult[] {
  const { players, round } = state
  if (!round) return []

  const communityCards = round.communityCards
  const nonFolded = players.filter(p => p.status !== 'folded' && p.status !== 'sitting-out')

  if (nonFolded.length === 0) return []
  if (nonFolded.length === 1) {
    return [{
      winnerId: nonFolded[0].id,
      winnerName: nonFolded[0].name,
      amount: round.pot.total,
      handDescription: 'Last player standing',
      handName: 'Last player standing'
    }]
  }

  // Evaluate each player's hand
  const evaluated = nonFolded.map(p => ({
    player: p,
    eval: evaluateHand(p.cards, communityCards)
  }))

  // Sort by hand strength descending
  evaluated.sort((a, b) => compareHandEvals(b.eval, a.eval))

  // Distribute main pot and side pots
  const results: WinResult[] = []
  const totalPot = round.pot.total

  // Simple: split pot among players with equal best hand
  const best = evaluated[0].eval
  const winners = evaluated.filter(e => compareHandEvals(e.eval, best) === 0)

  const share = Math.floor(totalPot / winners.length)
  const remainder = totalPot - share * winners.length

  winners.forEach((w, i) => {
    results.push({
      winnerId: w.player.id,
      winnerName: w.player.name,
      amount: share + (i === 0 ? remainder : 0),
      handDescription: w.eval.description,
      handName: w.eval.name
    })
  })

  return results
}

function resolveRound(state: GameState, walkover: boolean): GameState {
  const results = calculateWinners(state)

  // Reveal CPU cards at showdown (if not walkover)
  let players = state.players.map(p => {
    if (!walkover && p.status !== 'folded' && p.status !== 'sitting-out') {
      return { ...p, cards: p.cards.map(c => ({ ...c, faceUp: true })) }
    }
    return p
  })

  // Distribute chips
  for (const result of results) {
    players = players.map(p =>
      p.id === result.winnerId
        ? {
          ...p,
          chips: p.chips + result.amount,
          status: 'winner' as const,
          winAmount: result.amount,
          handDescription: result.handDescription
        }
        : p
    )
  }

  // Save to history
  const historyEntry: HandHistoryEntry = {
    roundNumber: state.round!.roundNumber,
    winners: results.map(r => r.winnerName),
    winningHand: results[0]?.handDescription ?? '',
    potAmount: state.round!.pot.total,
    actions: state.round!.bets,
    timestamp: Date.now()
  }

  const history = [...state.history, historyEntry].slice(-20) // Keep last 20

  return {
    ...state,
    players,
    round: {
      ...state.round!,
      phase: 'showdown'
    },
    history
  }
}

export function distributePot(state: GameState): GameState {
  // Already done in resolveRound, this finalizes to end-round
  return {
    ...state,
    round: state.round ? { ...state.round, phase: 'end-round' } : null
  }
}

export function isGameOver(state: GameState): boolean {
  const playersWithChips = state.players.filter(p => p.chips > 0)
  return playersWithChips.length <= 1
}

export function getActivePlayers(state: GameState): Player[] {
  return state.players.filter(p =>
    p.status !== 'folded' && p.status !== 'sitting-out'
  )
}

export function serializeState(state: GameState): string {
  // Convert Set to Array for serialization
  const serializable = {
    ...state,
    round: state.round ? {
      ...state.round,
      playersActedThisPhase: [...state.round.playersActedThisPhase]
    } : null
  }
  return JSON.stringify(serializable)
}

export function deserializeState(json: string): GameState {
  const parsed = JSON.parse(json)
  return {
    ...parsed,
    round: parsed.round ? {
      ...parsed.round,
      playersActedThisPhase: new Set<string>(parsed.round.playersActedThisPhase as string[])
    } : null
  }
}
