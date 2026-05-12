import { ref } from 'vue'

export type Locale = 'en' | 'pt'

const translations = {
  en: {
    // Lobby
    'lobby.newGame': 'New Game',
    'lobby.yourName': 'Your Name',
    'lobby.opponents': 'Opponents',
    'lobby.startingChips': 'Starting Chips',
    'lobby.blinds': 'Blinds',
    'lobby.dealMeIn': 'DEAL ME IN',
    'lobby.resume': '↩ Resume Saved Game',
    'lobby.tagline': "Texas Hold'em · No Limit · {n}-Player",
    // Game header
    'game.yourChips': 'YOUR CHIPS',
    'game.newGame': '🃏 New Game',
    'game.quitLobby': '🚪 Quit to Lobby',
    'game.round': 'Round',
    // Phases
    'phase.waiting': 'Waiting',
    'phase.pre-flop': 'Pre-Flop',
    'phase.flop': 'Flop',
    'phase.turn': 'Turn',
    'phase.river': 'River',
    'phase.showdown': 'Showdown',
    'phase.end-round': 'End Round',
    // Actions
    'action.fold': 'Fold',
    'action.check': 'Check',
    'action.call': 'Call',
    'action.raise': 'Raise',
    'action.allIn': 'All-In',
    'action.confirm': 'Confirm',
    'action.raiseTo': 'RAISE TO',
    'action.min': 'Min',
    'action.halfPot': '½ Pot',
    'action.pot': 'Pot',
    'action.2xPot': '2x Pot',
    // Player status
    'status.folded': 'FOLDED',
    'status.allIn': 'ALL-IN',
    'status.out': 'OUT',
    'status.thinking': 'thinking',
    // Game log
    'log.title': 'Hand History',
    'log.empty': 'No actions yet',
    'log.pastHands': 'Past Hands',
    'log.folds': 'folds',
    'log.checks': 'checks',
    'log.calls': 'calls',
    'log.raises': 'raises',
    'log.allIn': 'all-in!',
    // Winner overlay
    'winner.winner': 'WINNER!',
    'winner.split': 'SPLIT POT!',
    'winner.dismiss': 'Click anywhere to continue',
    // Game over
    'gameover.title': 'GAME OVER',
    'gameover.win': '🏆 You Win the Tournament!',
    'gameover.lose': "💀 You're Eliminated!",
    'gameover.playAgain': 'Play Again',
    // AI
    'ai.thinking': 'is thinking',
  },
  pt: {
    // Lobby
    'lobby.newGame': 'Novo Jogo',
    'lobby.yourName': 'Seu Nome',
    'lobby.opponents': 'Adversários',
    'lobby.startingChips': 'Fichas Iniciais',
    'lobby.blinds': 'Blinds',
    'lobby.dealMeIn': 'EMBARCAR',
    'lobby.resume': '↩ Continuar Jogo Salvo',
    'lobby.tagline': "Texas Hold'em · Sem Limite · {n} Jogadores",
    // Game header
    'game.yourChips': 'SUAS FICHAS',
    'game.newGame': '🃏 Novo Jogo',
    'game.quitLobby': '🚪 Voltar ao Lobby',
    'game.round': 'Rodada',
    // Phases
    'phase.waiting': 'Aguardando',
    'phase.pre-flop': 'Pré-Flop',
    'phase.flop': 'Flop',
    'phase.turn': 'Turn',
    'phase.river': 'River',
    'phase.showdown': 'Showdown',
    'phase.end-round': 'Fim da Rodada',
    // Actions
    'action.fold': 'Desistir',
    'action.check': 'Passar',
    'action.call': 'Pagar',
    'action.raise': 'Aumentar',
    'action.allIn': 'All-In',
    'action.confirm': 'Confirmar',
    'action.raiseTo': 'AUMENTAR PARA',
    'action.min': 'Mín',
    'action.halfPot': '½ Pote',
    'action.pot': 'Pote',
    'action.2xPot': '2x Pote',
    // Player status
    'status.folded': 'DESISTIU',
    'status.allIn': 'ALL-IN',
    'status.out': 'FORA',
    'status.thinking': 'pensando',
    // Game log
    'log.title': 'Histórico',
    'log.empty': 'Nenhuma ação ainda',
    'log.pastHands': 'Mãos Anteriores',
    'log.folds': 'desistiu',
    'log.checks': 'passou',
    'log.calls': 'pagou',
    'log.raises': 'aumentou',
    'log.allIn': 'all-in!',
    // Winner overlay
    'winner.winner': 'VENCEDOR!',
    'winner.split': 'POTE DIVIDIDO!',
    'winner.dismiss': 'Clique para continuar',
    // Game over
    'gameover.title': 'FIM DE JOGO',
    'gameover.win': '🏆 Você Venceu o Torneio!',
    'gameover.lose': '💀 Você Foi Eliminado!',
    'gameover.playAgain': 'Jogar Novamente',
    // AI
    'ai.thinking': 'está pensando',
  }
} as const

type TranslationKey = keyof typeof translations.en

// Module-level singleton — all components share same reactive locale
const locale = ref<Locale>(
  (localStorage.getItem('poker-locale') as Locale) ?? 'en'
)

export function useLocale() {
  function setLocale(l: Locale): void {
    locale.value = l
    localStorage.setItem('poker-locale', l)
  }

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const dict = translations[locale.value]
    let text: string = dict[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }

  return { locale, setLocale, t }
}
