import { useEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'

// Character sets for scramble effect
const CHAR_SETS = {
  /** Matrix-style: katakana, numbers, symbols */
  matrix: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789',
  /** Alphanumeric characters */
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  /** Numbers and symbols */
  numeric: '0123456789!@#$%^&*',
  /** Symbols only */
  symbols: '!@#$%^&*()[]{}|;:,.<>?/~`',
  /** Binary */
  binary: '01',
  /** Hex */
  hex: '0123456789ABCDEF',
} as const

type CharSetName = keyof typeof CHAR_SETS

type ScrambleConfig = {
  /** Text to reveal */
  text: string
  /** Whether animation should run */
  enabled?: boolean
  /** Delay before animation starts (seconds) */
  delay?: number
  /** Duration of scramble per character before reveal (seconds) */
  scrambleDuration?: number
  /** Time between each character starting its reveal (seconds) */
  stagger?: number
  /** How fast characters cycle during scramble (seconds per character change) */
  scrambleSpeed?: number
  /** Character set to use for scramble effect */
  charSet?: CharSetName | string
  /** Direction of reveal: 'left' starts from left, 'right' from right, 'random' random order, 'center' from center out */
  revealDirection?: 'left' | 'right' | 'random' | 'center'
  /** Callback when animation completes */
  onComplete?: () => void
}

type ScrambleResult = {
  /** Ref to attach to the text container element */
  containerRef: RefObject<HTMLSpanElement | null>
  /** Array of character span elements (available after animation starts) */
  chars: HTMLSpanElement[]
}

/**
 * Get a random character from the character set
 */
const getRandomChar = (charSet: string): string => {
  return charSet[Math.floor(Math.random() * charSet.length)]
}

/**
 * Get character indices in the specified order
 */
const getRevealOrder = (length: number, direction: ScrambleConfig['revealDirection']): number[] => {
  const indices = Array.from({ length }, (_, i) => i)

  switch (direction) {
    case 'right':
      return indices.reverse()
    case 'random':
      return indices.sort(() => Math.random() - 0.5)
    case 'center': {
      const center = Math.floor(length / 2)
      const result: number[] = []
      for (let i = 0; i <= center; i++) {
        if (center + i < length) result.push(center + i)
        if (center - i >= 0 && center - i !== center + i) result.push(center - i)
      }
      return result
    }
    case 'left':
    default:
      return indices
  }
}

/**
 * Hook for animating text with a Matrix-style scramble/decode effect.
 * Characters cycle through random characters before revealing the final text.
 */
const useScrambleText = (config: ScrambleConfig): ScrambleResult => {
  const {
    text,
    enabled = true,
    delay = 0.5,
    scrambleDuration = 0.8,
    stagger = 0.05,
    scrambleSpeed = 0.03,
    charSet = 'matrix',
    revealDirection = 'left',
    onComplete,
  } = config

  const containerRef = useRef<HTMLSpanElement>(null)
  const charsRef = useRef<HTMLSpanElement[]>([])
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    // Prevent double-run in StrictMode
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Clear any existing content
    container.innerHTML = ''
    charsRef.current = []

    // Resolve character set
    const chars = charSet in CHAR_SETS ? CHAR_SETS[charSet as CharSetName] : charSet

    // Split text and create spans
    const textChars = text.split('')
    const spans: HTMLSpanElement[] = []
    const finalChars: string[] = []

    textChars.forEach((char) => {
      const span = document.createElement('span')
      const displayChar = char === ' ' ? '\u00A0' : char
      span.textContent = char === ' ' ? '\u00A0' : getRandomChar(chars)
      span.style.display = 'inline-block'
      container.appendChild(span)
      spans.push(span)
      finalChars.push(displayChar)
    })

    charsRef.current = spans

    // Get reveal order
    const revealOrder = getRevealOrder(spans.length, revealDirection)

    // Track active intervals for cleanup
    const intervals: number[] = []
    const timeouts: number[] = []

    // Master timeline
    const timeline = gsap.timeline({ onComplete })

    // Initial delay
    timeline.to({}, { duration: delay })

    // Animate each character
    revealOrder.forEach((charIndex, orderIndex) => {
      const span = spans[charIndex]
      const finalChar = finalChars[charIndex]
      const startTime = orderIndex * stagger

      // Skip spaces - just set them immediately
      if (finalChar === '\u00A0') {
        timeline.call(() => {
          span.textContent = '\u00A0'
        }, [], startTime)
        return
      }

      // Start scrambling
      timeline.call(() => {
        const intervalId = window.setInterval(() => {
          span.textContent = getRandomChar(chars)
        }, scrambleSpeed * 1000)
        intervals.push(intervalId)

        // Stop scrambling and reveal after duration
        const timeoutId = window.setTimeout(() => {
          const idx = intervals.indexOf(intervalId)
          if (idx > -1) {
            window.clearInterval(intervalId)
            intervals.splice(idx, 1)
          }
          span.textContent = finalChar
        }, scrambleDuration * 1000)
        timeouts.push(timeoutId)
      }, [], startTime)
    })

    // Account for total animation time
    const totalDuration = (revealOrder.length - 1) * stagger + scrambleDuration
    timeline.to({}, { duration: totalDuration })

    return () => {
      timeline.kill()

      // Clear all intervals and timeouts
      intervals.forEach((id) => window.clearInterval(id))
      timeouts.forEach((id) => window.clearTimeout(id))

      if (container) {
        container.innerHTML = ''
      }

      charsRef.current = []
      // Note: Do NOT reset hasInitialized here - StrictMode cleanup would cause double animation
    }
  }, [enabled, text, delay, scrambleDuration, stagger, scrambleSpeed, charSet, revealDirection, onComplete])

  return {
    containerRef,
    chars: charsRef.current,
  }
}

export default useScrambleText
export { CHAR_SETS }
export type { ScrambleConfig, ScrambleResult, CharSetName }

