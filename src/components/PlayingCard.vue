<template>
  <div
    class="playing-card"
    :class="[
      `size-${size}`,
      { 'face-down': effectiveFaceDown, 'red-card': isRed, 'flipping': flipping }
    ]"
  >
    <div class="card-inner">
      <div class="card-front">
        <div class="card-corner card-corner-tl">
          <span class="corner-rank">{{ card.rank }}</span>
          <span class="corner-suit">{{ suitSymbol }}</span>
        </div>
        <div class="card-center">
          <span class="center-suit">{{ suitSymbol }}</span>
        </div>
        <div class="card-corner card-corner-br">
          <span class="corner-rank">{{ card.rank }}</span>
          <span class="corner-suit">{{ suitSymbol }}</span>
        </div>
      </div>
      <div class="card-back">
        <div class="card-back-pattern"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Card } from '../models/index'

const props = withDefaults(defineProps<{
  card: Card
  faceDown?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), {
  faceDown: false,
  size: 'md'
})

const flipping = ref(false)
const effectiveFaceDown = computed(() => props.faceDown || !props.card.faceUp)

watch(() => props.card.faceUp, (newVal, oldVal) => {
  if (!oldVal && newVal) {
    flipping.value = true
    setTimeout(() => { flipping.value = false }, 400)
  }
})

const suitSymbol = computed(() => {
  const map: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  }
  return map[props.card.suit] ?? '?'
})

const isRed = computed(() =>
  props.card.suit === 'hearts' || props.card.suit === 'diamonds'
)
</script>

<style scoped>
.playing-card {
  display: inline-block;
  perspective: 600px;
  cursor: default;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.4s ease;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3);
}

.face-down .card-inner {
  transform: rotateY(180deg);
}

.flipping .card-inner {
  animation: card-flip 0.4s ease;
}

@keyframes card-flip {
  0% { transform: rotateY(180deg); }
  100% { transform: rotateY(0deg); }
}

.card-front,
.card-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 6px;
}

.card-front {
  background: var(--card-white);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3px;
}

.red-card .card-front {
  color: var(--card-red);
}

.playing-card:not(.red-card) .card-front {
  color: #1a1a1a;
}

.card-back {
  background: linear-gradient(135deg, #1a3a5c 0%, #0d2240 50%, #1a3a5c 100%);
  transform: rotateY(180deg);
  overflow: hidden;
}

.card-back-pattern {
  position: absolute;
  inset: 4px;
  border: 2px solid rgba(201, 168, 76, 0.6);
  border-radius: 4px;
  background:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 8px,
      rgba(201, 168, 76, 0.15) 8px,
      rgba(201, 168, 76, 0.15) 10px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 8px,
      rgba(201, 168, 76, 0.15) 8px,
      rgba(201, 168, 76, 0.15) 10px
    );
}

.card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.card-corner-br {
  transform: rotate(180deg);
  align-self: flex-end;
}

.corner-rank {
  font-weight: 800;
  line-height: 1;
}

.corner-suit {
  line-height: 1;
}

.card-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

/* Sizes */
.size-sm {
  width: 42px;
  height: 62px;
}

.size-sm .corner-rank { font-size: 10px; }
.size-sm .corner-suit { font-size: 9px; }
.size-sm .center-suit { font-size: 22px; }
.size-sm .card-front { padding: 2px; }

.size-md {
  width: 60px;
  height: 88px;
}

.size-md .corner-rank { font-size: 13px; }
.size-md .corner-suit { font-size: 11px; }
.size-md .center-suit { font-size: 30px; }

.size-lg {
  width: 80px;
  height: 116px;
}

.size-lg .corner-rank { font-size: 17px; }
.size-lg .corner-suit { font-size: 14px; }
.size-lg .center-suit { font-size: 42px; }
</style>
