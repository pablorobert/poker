# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev       # Dev server at http://localhost:5173
bun run build     # Type-check (vue-tsc) + Vite bundle → dist/
bun run preview   # Serve production build locally
```

No test suite configured. Type checking via `vue-tsc -b` is the primary correctness gate.

## Architecture

**Royal Poker** — Texas Hold'em vs 1–3 CPU opponents. Vue 3 + TypeScript + Pinia + Vite + Bun.

### Core principle: engine knows nothing about Vue

All poker logic lives in `src/engine/` and `src/ai/` as pure TypeScript. The UI layer only reads/writes via the Pinia store.

### Data flow

```
User action → ActionControls.vue → gameStore.processAction()
                                        ↓
                               gameEngine.ts (validates, mutates state)
                                        ↓
                          Pinia reactivity → components re-render
                          localStorage watch → auto-persist after every action
                          aiPlayer.makeDecision() → next CPU action (with delay)
```

### Key modules

| Path | Responsibility |
|------|---------------|
| `src/engine/gameEngine.ts` | State machine: phases, action validation, pot management |
| `src/engine/handEvaluator.ts` | Hand ranking across all C(7,5) combos + tiebreakers |
| `src/engine/deck.ts` | Card creation, cryptographic shuffle, dealing |
| `src/ai/aiPlayer.ts` | CPU decisions with personality profiles (tight/loose/aggressive/passive) |
| `src/models/index.ts` | All TypeScript interfaces: `Card`, `Player`, `GameState`, etc. |
| `src/stores/gameStore.ts` | Single Pinia store — reactive state + localStorage sync |
| `src/composables/useLocale.ts` | i18n singleton (EN / PT-BR) |
| `src/composables/useSound.ts` | Procedural audio via Web Audio API (no external files) |
| `src/utils/random.ts` | `crypto.getRandomValues()` wrappers — never use `Math.random()` |

### Routes

- `/` → `LobbyView.vue` — configure players, chip counts, blinds
- `/game` → `GameView.vue` — active table

### Constraints

- **No `Math.random()`** — all randomness through `src/utils/random.ts` (crypto API).
- **Strict TypeScript** — no `any`. Types defined in `src/models/index.ts`.
- **No external audio files** — all sounds procedurally generated.
- Engine code (`src/engine/`, `src/ai/`) must remain framework-agnostic.
