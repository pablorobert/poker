import { ref } from 'vue'

type SoundType = 'chip' | 'card' | 'fold' | 'win' | 'allin' | 'check' | 'raise'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.3,
  rampDown = true,
  startDelay = 0
): void {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()

  osc.connect(gainNode)
  gainNode.connect(ctx.destination)

  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay)
  gainNode.gain.setValueAtTime(gain, ctx.currentTime + startDelay)

  if (rampDown) {
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration)
  }

  osc.start(ctx.currentTime + startDelay)
  osc.stop(ctx.currentTime + startDelay + duration + 0.05)
}

function playChip(): void {
  const ctx = getAudioContext()
  // Chip click: short filtered noise burst
  const bufferSize = ctx.sampleRate * 0.08
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15))
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1800
  filter.Q.value = 2
  const gain = ctx.createGain()
  gain.gain.value = 0.4
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

function playCard(): void {
  const ctx = getAudioContext()
  // Whoosh sound
  const bufferSize = ctx.sampleRate * 0.12
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize
    data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.6
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 600
  const gain = ctx.createGain()
  gain.gain.value = 0.3
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

function playFold(): void {
  playTone(120, 0.15, 'sawtooth', 0.15)
  playTone(80, 0.2, 'sine', 0.1, true, 0.05)
}

function playWin(): void {
  // Ascending arpeggio
  const notes = [261, 329, 392, 523, 659]
  notes.forEach((freq, i) => {
    playTone(freq, 0.3, 'sine', 0.25, true, i * 0.12)
  })
}

function playAllIn(): void {
  playTone(150, 0.4, 'sawtooth', 0.2)
  playTone(200, 0.3, 'sine', 0.15, true, 0.1)
  playTone(280, 0.5, 'sine', 0.2, true, 0.2)
}

function playCheck(): void {
  playTone(440, 0.08, 'sine', 0.15)
}

function playRaise(): void {
  playTone(320, 0.1, 'sine', 0.2)
  playTone(480, 0.15, 'sine', 0.2, true, 0.1)
}

export function useSound() {
  const enabled = ref(true)

  function setEnabled(val: boolean) {
    enabled.value = val
  }

  function playSound(type: SoundType): void {
    if (!enabled.value) return
    try {
      switch (type) {
        case 'chip': playChip(); break
        case 'card': playCard(); break
        case 'fold': playFold(); break
        case 'win': playWin(); break
        case 'allin': playAllIn(); break
        case 'check': playCheck(); break
        case 'raise': playRaise(); break
      }
    } catch {
      // Audio might not be available
    }
  }

  return { playSound, enabled, setEnabled }
}
