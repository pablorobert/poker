# ♠ Royal Poker

> **Texas Hold'em no-limit** — jogo completo, sem backend, sem dependências externas.  
> Funciona no browser. Salva localmente. Parece um cassino de verdade.

<div align="center">

![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?style=flat-square&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?style=flat-square&logo=bun&logoColor=black)
![No Backend](https://img.shields.io/badge/backend-none-success?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)

</div>

---

## ✨ Features

### 🃏 Engine de Poker Real
- Todas as fases: **Pre-Flop → Flop → Turn → River → Showdown**
- Avaliação real de mãos — High Card até Royal Flush
- Comparação e desempate corretos entre todas as combinações C(7,5)
- Blinds rotativos, dealer button, side pots
- Ações completas: Fold · Check · Call · Raise · All-In

### 🤖 Jogadores CPU
- Heurísticas baseadas em força da mão + pot odds
- Personalidades distintas: tight, loose, aggressive, passive, balanced
- Bluff chance configurável por perfil
- Delay de "thinking" para sensação humana (800ms–2800ms)

### 🎨 UI Estilo Cassino
- Mesa oval com feltro verde e borda dourada
- Cartas com flip animation e verso decorado
- Fichas visuais em pilha por valor
- Highlight animado no jogador ativo
- Overlay de vencedor com fogos de artifício
- Timer visual por turno com auto-fold
- Raise slider + presets rápidos (Min / ½ Pot / Pot / 2x Pot)

### 💾 Persistência Total
- Estado salvo automaticamente no `localStorage` a cada ação
- Feche o browser, reabra — partida continua do mesmo ponto
- Histórico das últimas 20 mãos

### 🌎 Internacionalização
- Português 🇧🇷 e Inglês 🇺🇸
- Troca ao vivo sem reload
- Preferência salva no `localStorage`

### 🔊 Sons Procedurais
- Gerados via **Web Audio API** — sem arquivos externos
- Fichas, cartas, fold, vitória, all-in
- Toggle mute disponível

---

## 🚀 Rodando Localmente

```bash
# Clonar
git clone https://github.com/seu-usuario/royal-poker.git
cd royal-poker

# Instalar dependências
bun install

# Rodar em dev
bun run dev
```

Abre em `http://localhost:5173`

```bash
# Build de produção
bun run build
```

---

## 🗂️ Arquitetura

```
src/
├── engine/
│   ├── deck.ts            # Criação, shuffle criptográfico, distribuição
│   ├── handEvaluator.ts   # Avaliação real de mãos (todas combinações C(7,5))
│   └── gameEngine.ts      # Máquina de estado Texas Hold'em — pura, sem Vue
│
├── ai/
│   └── aiPlayer.ts        # Decisões CPU com heurísticas + personalidade
│
├── models/
│   └── index.ts           # Tipos TypeScript strict (Card, Player, GameState…)
│
├── stores/
│   └── gameStore.ts       # Pinia — estado reativo + persistência localStorage
│
├── composables/
│   ├── useLocale.ts        # i18n singleton reativo (EN / PT-BR)
│   ├── useSound.ts         # Sons Web Audio API procedurais
│   └── useAnimation.ts     # Helpers de animação
│
├── components/
│   ├── PokerTable.vue      # Mesa oval com posicionamento dinâmico
│   ├── PlayerSeat.vue      # Seat individual (cartas, fichas, status, badges)
│   ├── PlayingCard.vue     # Carta com flip animation CSS 3D
│   ├── CommunityCards.vue  # Board (Flop/Turn/River) com deal animation
│   ├── ActionControls.vue  # Painel de ações + slider de raise + timer
│   ├── ChipStack.vue       # Fichas visuais em pilha
│   ├── PotDisplay.vue      # Pote com animação de atualização
│   ├── WinnerOverlay.vue   # Overlay de vitória com fogos
│   ├── GameLog.vue         # Histórico de ações e mãos anteriores
│   ├── DealerButton.vue    # Badges D / SB / BB
│   ├── LanguageToggle.vue  # Seletor 🇺🇸 🇧🇷
│   └── SoundToggle.vue     # Mute/unmute
│
└── views/
    ├── LobbyView.vue       # Tela inicial: configuração da partida
    └── GameView.vue        # Tela do jogo
```

### Princípio de Design

> **A engine não sabe que o Vue existe.**

Toda lógica de poker vive em `src/engine/` e `src/ai/` — TypeScript puro, sem imports de `vue`. A UI é um consumidor passivo do estado. Isso significa que a engine pode ser reaproveitada futuramente para:

- Multiplayer via WebSocket
- Backend Node.js
- Replay / análise de mãos
- Torneios

---

## 🎲 Regras Implementadas

| Mão | Detectada | Desempate |
|-----|-----------|-----------|
| Royal Flush | ✅ | — |
| Straight Flush | ✅ | High card |
| Four of a Kind | ✅ | Quad + kicker |
| Full House | ✅ | Trips + pair |
| Flush | ✅ | 5 kickers |
| Straight | ✅ | High card (A-low ok) |
| Three of a Kind | ✅ | Trips + 2 kickers |
| Two Pair | ✅ | High pair + low pair + kicker |
| One Pair | ✅ | Pair + 3 kickers |
| High Card | ✅ | 5 kickers |

---

## 🔐 Aleatoriedade

Sem `Math.random()`. Todas as operações de sorteio usam:

```ts
function secureRandom(): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] / (0xFFFFFFFF + 1)
}
```

---

## 🛠️ Stack

| Ferramenta | Uso |
|------------|-----|
| **Vue 3** + Composition API | UI reativa |
| **TypeScript strict** | Tipos em toda a codebase |
| **Pinia** | Estado global |
| **Vite 8** | Dev server + build |
| **Bun** | Package manager + runtime |
| **Web Audio API** | Sons procedurais |
| **localStorage** | Persistência |

Sem Firebase. Sem Supabase. Sem backend. Sem nada.

---

## 📸 Telas

```
┌─────────────────────────────────────────┐
│  ☰  ♠ ROYAL POKER          $1.2k  🔊   │
├─────────────────────────────────────────┤
│                                         │
│   ┌──────── Mesa de Feltro Verde ─────┐ │
│   │  [🐯 Apollo]  [🦊 Blaze]         │ │
│   │                                   │ │
│   │      ♠A  ♥K  ♦Q  ♣J  ♥10        │ │
│   │           ┌── POT ──┐             │ │
│   │           │  $480   │             │ │
│   │           └─────────┘             │ │
│   │                                   │ │
│   │           [😎  You]               │ │
│   │         ♥A  ♠K  (D)              │ │
│   └───────────────────────────────────┘ │
│                                         │
│  [Desistir] [Passar] [Pagar $40] [↑]   │
└─────────────────────────────────────────┘
```

---

## 🗺️ Roadmap

- [ ] Multiplayer via WebSocket
- [ ] Modo torneio (blinds crescentes)
- [ ] Replay de mãos
- [ ] Estatísticas por sessão
- [ ] Diferentes temas de mesa
- [ ] Dificuldade configurável das CPUs
- [ ] Seed reproduzível para debug

---

## 📄 Licença

MIT — use, modifique, distribua.
