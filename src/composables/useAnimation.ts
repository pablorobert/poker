import { ref, nextTick } from 'vue'

export function useAnimation() {
  const animating = ref(false)

  function triggerAnimation(el: HTMLElement, className: string, duration = 600): Promise<void> {
    return new Promise(resolve => {
      el.classList.add(className)
      setTimeout(() => {
        el.classList.remove(className)
        resolve()
      }, duration)
    })
  }

  async function animateChipFly(
    fromEl: HTMLElement,
    toEl: HTMLElement,
    count = 1
  ): Promise<void> {
    const fromRect = fromEl.getBoundingClientRect()
    const toRect = toEl.getBoundingClientRect()

    for (let i = 0; i < Math.min(count, 5); i++) {
      await nextTick()
      const chip = document.createElement('div')
      chip.className = 'chip-fly-particle'
      chip.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--gold);
        left: ${fromRect.left + fromRect.width / 2}px;
        top: ${fromRect.top + fromRect.height / 2}px;
        pointer-events: none;
        z-index: 9999;
        transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      `
      document.body.appendChild(chip)

      await new Promise<void>(r => requestAnimationFrame(() => {
        chip.style.left = `${toRect.left + toRect.width / 2}px`
        chip.style.top = `${toRect.top + toRect.height / 2}px`
        chip.style.opacity = '0'
        chip.style.transform = 'scale(0.3)'
        r()
      }))

      setTimeout(() => chip.remove(), 600 + i * 50)
      await new Promise(r => setTimeout(r, 80))
    }
  }

  function pulseElement(el: HTMLElement): void {
    el.classList.add('pulse-once')
    setTimeout(() => el.classList.remove('pulse-once'), 500)
  }

  return { animating, triggerAnimation, animateChipFly, pulseElement }
}
