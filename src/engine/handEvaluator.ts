import type { Card, HandEvaluation, HandRank } from '../models/index'

function getCombinations(arr: Card[], k: number): Card[][] {
  const result: Card[][] = []
  function combine(start: number, current: Card[]) {
    if (current.length === k) {
      result.push([...current])
      return
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i])
      combine(i + 1, current)
      current.pop()
    }
  }
  combine(0, [])
  return result
}

function isFlush(cards: Card[]): boolean {
  return cards.every(c => c.suit === cards[0].suit)
}

function isStraight(values: number[]): { is: boolean; high: number } {
  const sorted = [...new Set(values)].sort((a, b) => b - a)
  // Normal straight
  if (sorted.length === 5) {
    if (sorted[0] - sorted[4] === 4) return { is: true, high: sorted[0] }
  }
  // Wheel: A-2-3-4-5
  if (sorted[0] === 14 && sorted[1] === 5 && sorted[2] === 4 && sorted[3] === 3 && sorted[4] === 2) {
    return { is: true, high: 5 }
  }
  return { is: false, high: 0 }
}

function groupByValue(cards: Card[]): Map<number, Card[]> {
  const groups = new Map<number, Card[]>()
  for (const card of cards) {
    const existing = groups.get(card.value) ?? []
    groups.set(card.value, [...existing, card])
  }
  return groups
}

function evaluate5(cards: Card[]): HandEvaluation {
  const values = cards.map(c => c.value).sort((a, b) => b - a)
  const groups = groupByValue(cards)
  const counts = [...groups.values()].map(g => g.length).sort((a, b) => b - a)
  const flush = isFlush(cards)
  const straight = isStraight(values)

  const sortedGroups = [...groups.entries()].sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length
    return b[0] - a[0]
  })

  // Royal Flush
  if (flush && straight.is && straight.high === 14) {
    return {
      rank: 9 as HandRank,
      name: 'Royal Flush',
      description: 'Royal Flush',
      tiebreakers: [14],
      bestCards: cards
    }
  }

  // Straight Flush
  if (flush && straight.is) {
    return {
      rank: 8 as HandRank,
      name: 'Straight Flush',
      description: `Straight Flush, ${rankName(straight.high)} high`,
      tiebreakers: [straight.high],
      bestCards: cards
    }
  }

  // Four of a Kind
  if (counts[0] === 4) {
    const quad = sortedGroups[0][0]
    const kicker = sortedGroups[1][0]
    return {
      rank: 7 as HandRank,
      name: 'Four of a Kind',
      description: `Four of a Kind, ${rankName(quad)}s`,
      tiebreakers: [quad, kicker],
      bestCards: cards
    }
  }

  // Full House
  if (counts[0] === 3 && counts[1] === 2) {
    const trips = sortedGroups[0][0]
    const pair = sortedGroups[1][0]
    return {
      rank: 6 as HandRank,
      name: 'Full House',
      description: `Full House, ${rankName(trips)}s over ${rankName(pair)}s`,
      tiebreakers: [trips, pair],
      bestCards: cards
    }
  }

  // Flush
  if (flush) {
    return {
      rank: 5 as HandRank,
      name: 'Flush',
      description: `Flush, ${rankName(values[0])} high`,
      tiebreakers: values,
      bestCards: cards
    }
  }

  // Straight
  if (straight.is) {
    return {
      rank: 4 as HandRank,
      name: 'Straight',
      description: `Straight, ${rankName(straight.high)} high`,
      tiebreakers: [straight.high],
      bestCards: cards
    }
  }

  // Three of a Kind
  if (counts[0] === 3 && counts[1] !== 2) {
    const trips = sortedGroups[0][0]
    const kickers = sortedGroups.slice(1).map(([v]) => v)
    return {
      rank: 3 as HandRank,
      name: 'Three of a Kind',
      description: `Three of a Kind, ${rankName(trips)}s`,
      tiebreakers: [trips, ...kickers],
      bestCards: cards
    }
  }

  // Two Pair
  if (counts[0] === 2 && counts[1] === 2) {
    const high = sortedGroups[0][0]
    const low = sortedGroups[1][0]
    const kicker = sortedGroups[2][0]
    return {
      rank: 2 as HandRank,
      name: 'Two Pair',
      description: `Two Pair, ${rankName(high)}s and ${rankName(low)}s`,
      tiebreakers: [high, low, kicker],
      bestCards: cards
    }
  }

  // Pair
  if (counts[0] === 2) {
    const pair = sortedGroups[0][0]
    const kickers = sortedGroups.slice(1).map(([v]) => v)
    return {
      rank: 1 as HandRank,
      name: 'One Pair',
      description: `One Pair, ${rankName(pair)}s`,
      tiebreakers: [pair, ...kickers],
      bestCards: cards
    }
  }

  // High Card
  return {
    rank: 0 as HandRank,
    name: 'High Card',
    description: `High Card, ${rankName(values[0])}`,
    tiebreakers: values,
    bestCards: cards
  }
}

function rankName(value: number): string {
  const map: Record<number, string> = {
    14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack',
    10: 'Ten', 9: 'Nine', 8: 'Eight', 7: 'Seven',
    6: 'Six', 5: 'Five', 4: 'Four', 3: 'Three', 2: 'Two'
  }
  return map[value] ?? String(value)
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
  const all = [...holeCards, ...communityCards]
  if (all.length < 5) {
    // Partial hand - evaluate best from available
    if (all.length < 2) {
      return {
        rank: 0 as HandRank,
        name: 'High Card',
        description: 'High Card',
        tiebreakers: all.map(c => c.value).sort((a, b) => b - a),
        bestCards: all
      }
    }
  }

  const combos = all.length >= 5 ? getCombinations(all, 5) : [all.slice(0, 5).concat(all.slice(5))]
  let best: HandEvaluation | null = null

  for (const combo of combos) {
    if (combo.length < 5) continue
    const eval5 = evaluate5(combo)
    if (!best || compareHandEvals(eval5, best) > 0) {
      best = eval5
    }
  }

  return best ?? evaluate5(all.slice(0, 5))
}

export function compareHandEvals(a: HandEvaluation, b: HandEvaluation): number {
  if (a.rank !== b.rank) return a.rank - b.rank
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const av = a.tiebreakers[i] ?? 0
    const bv = b.tiebreakers[i] ?? 0
    if (av !== bv) return av - bv
  }
  return 0
}

export function handStrength(holeCards: Card[], communityCards: Card[]): number {
  // Returns 0-1 estimate of hand strength
  if (holeCards.length === 0) return 0
  const eval_ = evaluateHand(holeCards, communityCards)
  // Normalize: rank 0-9 maps to 0-1, with refinements based on tiebreakers
  const base = eval_.rank / 9
  const topTiebreaker = (eval_.tiebreakers[0] ?? 0) / 14
  return Math.min(1, base * 0.85 + topTiebreaker * 0.15)
}
