import type { Card, Deck, Rank, Suit } from '../models/index'
import { secureShuffle } from '../utils/random'

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

function rankValue(rank: Rank): number {
  const map: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  }
  return map[rank]
}

export function createDeck(): Deck {
  const cards: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ suit, rank, value: rankValue(rank), faceUp: false })
    }
  }
  return { cards: secureShuffle(cards), usedCards: [] }
}

export function shuffleDeck(deck: Deck): Deck {
  const all = [...deck.cards, ...deck.usedCards]
  return { cards: secureShuffle(all), usedCards: [] }
}

export function dealCards(deck: Deck, count: number): { cards: Card[]; deck: Deck } {
  if (deck.cards.length < count) {
    throw new Error(`Not enough cards in deck: need ${count}, have ${deck.cards.length}`)
  }
  const cards = deck.cards.slice(0, count).map(c => ({ ...c, faceUp: true }))
  const remaining = deck.cards.slice(count)
  const used = [...deck.usedCards, ...cards]
  return { cards, deck: { cards: remaining, usedCards: used } }
}

export function dealFaceDown(deck: Deck, count: number): { cards: Card[]; deck: Deck } {
  if (deck.cards.length < count) {
    throw new Error(`Not enough cards in deck: need ${count}, have ${deck.cards.length}`)
  }
  const cards = deck.cards.slice(0, count).map(c => ({ ...c, faceUp: false }))
  const remaining = deck.cards.slice(count)
  const used = [...deck.usedCards, ...cards]
  return { cards, deck: { cards: remaining, usedCards: used } }
}

export function burnCard(deck: Deck): Deck {
  if (deck.cards.length === 0) return deck
  const burned = { ...deck.cards[0] }
  return {
    cards: deck.cards.slice(1),
    usedCards: [...deck.usedCards, burned]
  }
}
