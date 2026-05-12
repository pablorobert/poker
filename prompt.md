Crie um jogo completo de Poker Texas Hold’em utilizando:

Vue 3
TypeScript
Bun
Vite
Sem backend
Persistência local via localStorage
UI moderna inspirada em mesas de cassino
Arquitetura limpa e extensível
Suporte a jogadores humanos + CPUs

O projeto deve parecer um jogo real e polido, não apenas uma demo técnica.

Objetivo

Implementar um Texas Hold’em funcional e visualmente agradável com:

1 jogador humano mínimo
Até 4 jogadores totais
CPUs preenchendo vagas automaticamente
Engine real de poker
Rodadas completas
Sistema de apostas
Persistência local
UX premium estilo cassino moderno
Stack obrigatória
Vue 3
TypeScript strict
Bun
Vite
Composition API
Sem backend
Sem Firebase/Supabase
Persistência local
Arquitetura obrigatória

Separar claramente:

src/
  components/
  composables/
  engine/
  ai/
  models/
  stores/
  utils/
  views/

Toda lógica de poker deve existir fora dos componentes Vue.

A UI apenas consome estado.

Engine de Poker (IMPORTANTÍSSIMO)

Implementar engine real de Texas Hold’em.

Suportar:

pre-flop
flop
turn
river
showdown

A engine deve:

validar apostas
controlar blinds
controlar pote
detectar fold/check/call/raise/all-in
controlar turnos
detectar vencedor
dividir potes corretamente
suportar side pots futuramente
Regras reais

Implementar regras reais de Texas Hold’em.

Deck

Criar deck completo de 52 cartas.

Implementar:

shuffle
distribuição
descarte
controle de cartas usadas
Randomização (IMPORTANTE)

Usar pseudo-random forte inspirado em crypto.

Preferência:

crypto.getRandomValues

Evitar:

Math.random

Criar utilitário próprio:

secureRandom()
secureShuffle()
Avaliação de mãos

Implementar avaliação REAL de mãos.

Suportar:

Mão
High Card
Pair
Two Pair
Three of a Kind
Straight
Flush
Full House
Four of a Kind
Straight Flush
Royal Flush

A engine deve:

comparar mãos corretamente
desempatar corretamente
gerar descrição da mão
CPUs

Implementar CPUs básicas inicialmente.

Cada CPU deve:

tomar decisões automáticas
ter comportamento minimamente humano
usar heurísticas simples

Ações:

fold
call
raise
check
Quantidade de jogadores

Permitir:

1 humano + 1 CPU mínimo
até 4 jogadores totais

Se faltarem jogadores humanos:

preencher automaticamente com CPUs

Exemplos:

1 humano + 3 CPU
2 humanos + 2 CPU
3 humanos + 1 CPU
Fluxo do jogo

Implementar:

Blind rotation
Distribuição inicial
Betting rounds
Flop
Turn
River
Showdown
Distribuição do pote
Nova rodada
UI/UX

A interface deve parecer um cassino moderno.

Inspirar-se em:

PokerStars
mesas digitais modernas
jogos mobile premium
Visual obrigatório

Implementar:

mesa verde estilo cassino
cartas bonitas
fichas visuais
glow suave
sombras leves
animações suaves
sensação premium

Evitar:

aparência enterprise/dashboard
UI flat genérica
Elementos importantes

Implementar:

animação de distribuição de cartas
highlight do jogador atual
animação do pote
reveal do flop/turn/river
animações de fichas
feedback visual de ações
Estado visual dos jogadores

Cada jogador deve mostrar:

avatar simples
stack atual
cartas
status:
thinking
folded
all-in
winner
dealer button
blind indicators
Controles do jogador

Implementar ações:

Fold
Check
Call
Raise
All-in

Raise deve ter:

slider
input numérico
presets rápidos
Persistência

Persistir automaticamente:

stacks
rodada atual
cartas
dealer
blinds
histórico
jogadores
CPUs

O usuário deve conseguir:

fechar navegador
atualizar página
continuar partida
Modelagem

Criar tipos fortes para:

Card
Deck
Player
PokerHand
Bet
Pot
RoundState
GameState
AIPlayer

Evitar any.

Estrutura da engine

A engine deve ser reutilizável futuramente para:

multiplayer online
websocket
backend Node.js
replay
torneios
IA avançada

Evitar acoplamento com browser/UI.

IA futura

Preparar estrutura para:

dificuldade
personalidade
agressividade
bluff
estatísticas

Mesmo que inicialmente simples.

Histórico

Implementar histórico elegante contendo:

ações
apostas
vitórias
showdown
mãos vencedoras
Responsividade

Funcionar bem em:

desktop
tablet
mobile

No mobile:

reorganizar mesa
aumentar controles
simplificar layout sem perder qualidade
Sons

Adicionar sons leves:

fichas
cartas
vitória
fold
all-in

Sem exageros.

Performance

Garantir:

poucas re-renderizações
animações suaves
estado eficiente
engine desacoplada
Qualidade do código

Quero:

arquitetura limpa
código legível
baixo acoplamento
componentes reutilizáveis
nomes claros
sem overengineering desnecessário
Scripts esperados
bun install
bun run dev
bun run build
Extras desejáveis

Se houver tempo:

replay local
estatísticas
hand history
dark mode refinado
diferentes temas de mesa
dificuldade das CPUs
modo torneio
seed reproduzível
debug overlay da engine
NÃO FAZER
Não usar backend
Não usar Firebase
Não usar Supabase
Não simplificar regras reais
Não colocar lógica da engine dentro da UI
Não usar Math.random diretamente
Sensação desejada

O objetivo NÃO é parecer:

dashboard
demo técnica
app enterprise

O objetivo é parecer:

jogo premium de poker
mesa digital moderna
experiência estilo cassino online
Prioridades
Engine correta
Regras reais
Avaliação correta das mãos
UX premium
Arquitetura limpa
Persistência local
CPUs funcionais

O resultado final deve parecer um jogo indie moderno de poker pronto para evoluir futuramente para multiplayer online real.
