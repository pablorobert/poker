<template>
  <div class="table-wrapper">
    <div class="poker-table">
      <!-- Table felt -->
      <div class="table-felt">
        <!-- Table rim -->
        <div class="table-rim"></div>

        <!-- Player seats - positioned around the table -->
        <div
          v-for="(player, idx) in players"
          :key="player.id"
          class="seat-wrapper"
          :style="getSeatStyle(idx, players.length)"
        >
          <PlayerSeat
            :player="player"
            :is-active="isActivePlayer(idx)"
            :position="idx"
            :show-cpu-cards="phase === 'showdown'"
          />
        </div>

        <!-- Center area -->
        <div class="table-center">
          <!-- Community cards -->
          <CommunityCards :cards="communityCards" :phase="phase" />

          <!-- Pot -->
          <PotDisplay :pot="pot" />

          <!-- Round info -->
          <div v-if="roundNumber > 0" class="round-info">
            Round {{ roundNumber }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player, Card, GamePhase, Pot } from '../models/index'
import PlayerSeat from './PlayerSeat.vue'
import CommunityCards from './CommunityCards.vue'
import PotDisplay from './PotDisplay.vue'

const props = defineProps<{
  players: Player[]
  communityCards: Card[]
  phase: GamePhase | null
  pot: Pot | null
  currentPlayerIndex: number
  roundNumber: number
}>()

function isActivePlayer(idx: number): boolean {
  if (!props.phase || props.phase === 'showdown' || props.phase === 'end-round') return false
  return idx === props.currentPlayerIndex &&
    props.players[idx]?.status === 'active'
}

// Position seats in an oval around the table
function getSeatStyle(idx: number, total: number): Record<string, string> {
  let angle: number

  if (total === 2) {
    // Heads-up: human (idx=0) right, CPU (idx=1) left
    angle = idx === 0 ? 0 : 180
  } else {
    // 3-4 players: distribute evenly, human (idx=0) at bottom center
    angle = (idx / total) * 360 + 90 // +90 = bottom in CSS coords (y-axis inverted)
  }

  const radian = (angle * Math.PI) / 180

  const rx = total === 3 ? 54 : 46
  const ry = total === 3 ? 38 : 44

  const x = 50 + rx * Math.cos(radian)
  const y = 50 + ry * Math.sin(radian)

  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)'
  }
}

</script>

<style scoped>
.table-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1;
  padding: 20px;
  min-height: 0;
}

.poker-table {
  position: relative;
  width: min(700px, 95vw);
  aspect-ratio: 1.5 / 1;
  border-radius: 50%;
}

.table-felt {
  position: absolute;
  inset: 20px;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at center, #1e7a42 0%, #1a6b3c 50%, #145c32 100%);
  box-shadow:
    inset 0 0 30px rgba(0,0,0,0.4),
    inset 0 0 60px rgba(0,0,0,0.2),
    0 0 0 6px #0d3d1e,
    0 0 0 12px #8b6914,
    0 0 0 18px #6b4f0a,
    0 10px 40px rgba(0,0,0,0.7);
  overflow: visible;
}

/* Felt texture overlay */
.table-felt::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.03) 2px,
      rgba(0,0,0,0.03) 4px
    );
  pointer-events: none;
}

/* Inner glow */
.table-felt::after {
  content: '';
  position: absolute;
  inset: 5%;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.06);
  pointer-events: none;
}

.table-rim {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: linear-gradient(135deg,
    rgba(255,255,255,0.15) 0%,
    rgba(255,255,255,0.05) 40%,
    rgba(0,0,0,0.2) 60%,
    rgba(255,255,255,0.08) 100%
  );
  pointer-events: none;
  z-index: 0;
}

.seat-wrapper {
  position: absolute;
  z-index: 10;
}

.table-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  pointer-events: none;
  z-index: 5;
}

.table-center > * {
  pointer-events: all;
}

.round-info {
  font-size: 10px;
  color: rgba(255,255,255,0.25);
  letter-spacing: 2px;
  text-transform: uppercase;
}
</style>
