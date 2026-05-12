import type { Player, GameState, BetAction } from '../models/index'
import { handStrength } from '../engine/handEvaluator'
import { getValidActions } from '../engine/gameEngine'
import { secureRandom, secureRandomInt } from '../utils/random'

export interface AIDecision {
  action: BetAction
  amount?: number
  thinkingMs: number
}

interface PersonalityProfile {
  aggressiveness: number  // 0-1
  bluffChance: number     // 0-1
  tightnessThreshold: number // hand strength threshold to continue
  raiseFrequency: number  // 0-1 when hand is strong enough to raise
}

const PERSONALITIES: Record<string, PersonalityProfile> = {
  tight: { aggressiveness: 0.3, bluffChance: 0.05, tightnessThreshold: 0.45, raiseFrequency: 0.5 },
  loose: { aggressiveness: 0.5, bluffChance: 0.2, tightnessThreshold: 0.2, raiseFrequency: 0.4 },
  aggressive: { aggressiveness: 0.8, bluffChance: 0.25, tightnessThreshold: 0.3, raiseFrequency: 0.75 },
  passive: { aggressiveness: 0.2, bluffChance: 0.05, tightnessThreshold: 0.3, raiseFrequency: 0.15 },
  balanced: { aggressiveness: 0.5, bluffChance: 0.12, tightnessThreshold: 0.3, raiseFrequency: 0.45 }
}

function getPersonality(player: Player): PersonalityProfile {
  // Derive personality from player id/name seed for consistency
  const seed = player.id.charCodeAt(player.id.length - 1)
  const personalities = Object.values(PERSONALITIES)
  return personalities[seed % personalities.length]
}

function holeCardStrength(cards: { value: number; suit: string }[]): number {
  if (cards.length < 2) return 0.2
  const [c1, c2] = [...cards].sort((a, b) => b.value - a.value)
  const highVal = c1.value
  const lowVal = c2.value
  const paired = highVal === lowVal
  const suited = c1.suit === c2.suit
  const connected = highVal - lowVal <= 2

  let strength = 0

  // Premium pairs
  if (paired) {
    if (highVal >= 13) strength = 0.9        // AA, KK
    else if (highVal >= 11) strength = 0.8   // QQ, JJ
    else if (highVal >= 9) strength = 0.7    // TT, 99
    else if (highVal >= 7) strength = 0.55   // 88, 77
    else strength = 0.45                     // 66 and below
  } else {
    // High cards
    const highBonus = (highVal - 2) / 12 * 0.4
    const lowBonus = (lowVal - 2) / 12 * 0.2
    strength = highBonus + lowBonus
    if (suited) strength += 0.08
    if (connected) strength += 0.06
    // Ace-X bonus
    if (highVal === 14) strength += 0.1
  }

  return Math.min(1, Math.max(0, strength))
}

export function makeDecision(player: Player, state: GameState): AIDecision {
  const validActions = getValidActions(state, player.id)
  if (validActions.length === 0) {
    return { action: 'fold', thinkingMs: 500 }
  }

  const round = state.round
  if (!round) return { action: 'fold', thinkingMs: 500 }

  const personality = getPersonality(player)
  const communityCards = round.communityCards

  // Calculate hand strength
  let strength: number
  if (communityCards.length === 0) {
    strength = holeCardStrength(player.cards)
  } else {
    strength = handStrength(player.cards, communityCards)
    // Blend with hole card strength on flop
    if (communityCards.length === 3) {
      strength = strength * 0.7 + holeCardStrength(player.cards) * 0.3
    }
  }

  // Bluff check
  const isBluffing = secureRandom() < personality.bluffChance
  if (isBluffing) {
    strength = Math.min(1, strength + 0.35)
  }

  const maxBet = Math.max(...state.players.map(p => p.currentBet))
  const toCall = maxBet - player.currentBet
  const potSize = round.pot.total

  // Pot odds calculation
  const potOdds = potSize > 0 ? toCall / (potSize + toCall) : 0

  const hasCheck = validActions.some(a => a.action === 'check')
  const hasCall = validActions.some(a => a.action === 'call')
  const hasRaise = validActions.some(a => a.action === 'raise')
  const hasFold = validActions.some(a => a.action === 'fold')
  const hasAllIn = validActions.some(a => a.action === 'all-in')

  let action: BetAction
  let amount: number | undefined

  if (hasCheck) {
    // Free to check
    if (strength > personality.tightnessThreshold && hasRaise && secureRandom() < personality.raiseFrequency) {
      action = 'raise'
      const raiseAction = validActions.find(a => a.action === 'raise')!
      const minR = raiseAction.minAmount ?? round.minRaise
      const maxR = raiseAction.maxAmount ?? player.chips
      // Size raise based on hand strength and personality
      const multiplier = 1 + strength * personality.aggressiveness * 2
      amount = Math.min(maxR, Math.floor(minR * multiplier))
    } else {
      action = 'check'
    }
  } else if (hasCall) {
    // Need to call
    if (strength > personality.tightnessThreshold && strength > potOdds) {
      // Good enough to continue
      if (hasRaise && strength > 0.65 && secureRandom() < personality.raiseFrequency * strength) {
        action = 'raise'
        const raiseAction = validActions.find(a => a.action === 'raise')!
        const minR = raiseAction.minAmount ?? round.minRaise
        const maxR = raiseAction.maxAmount ?? player.chips
        const potBet = Math.floor(potSize * personality.aggressiveness)
        amount = Math.min(maxR, Math.max(minR, potBet))
      } else if (hasAllIn && strength > 0.88 && player.chips < potSize * 0.3) {
        action = 'all-in'
      } else {
        action = 'call'
      }
    } else if (hasFold) {
      // Too weak or bad pot odds
      action = 'fold'
    } else {
      action = 'call' // forced (no fold option, shouldn't happen but safety)
    }
  } else if (hasAllIn) {
    // Only all-in available (e.g., short stack)
    if (strength > 0.5 || player.chips < state.settings.bigBlind * 3) {
      action = 'all-in'
    } else {
      action = hasFold ? 'fold' : 'all-in'
    }
  } else {
    action = hasFold ? 'fold' : 'check'
  }

  // Thinking time: 800ms - 3000ms based on difficulty-ish variance
  const thinkingMs = secureRandomInt(800, 2800)

  return { action, amount, thinkingMs }
}
