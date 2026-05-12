export function secureRandom(): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] / (0xFFFFFFFF + 1)
}

export function secureShuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function secureRandomInt(min: number, max: number): number {
  return Math.floor(secureRandom() * (max - min + 1)) + min
}
