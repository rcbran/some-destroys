import { useEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'

type ScatterConfig = {
  /** Text to animate */
  text: string
  /** Whether animation should run */
  enabled?: boolean
  /** Delay before animation starts (seconds) */
  delay?: number
  /** Duration of scatter animation (seconds) */
  duration?: number
  /** Time between each character animation (seconds) */
  stagger?: number
  /** Horizontal scatter range in pixels */
  scatterX?: number
  /** Vertical scatter range in pixels */
  scatterY?: number
  /** Max rotation in degrees */
  rotation?: number
  /** GSAP easing function */
  ease?: string
  /** Callback when animation completes */
  onComplete?: () => void
}

type ScatterResult = {
  /** Ref to attach to the text container element */
  containerRef: RefObject<HTMLSpanElement | null>
  /** Array of character span elements (available after animation starts) */
  chars: HTMLSpanElement[]
}

/**
 * Hook for animating text with a scatter-in effect.
 * Characters appear from random positions and settle into place.
 */
const useScatterText = (config: ScatterConfig): ScatterResult => {
  const {
    text,
    enabled = true,
    delay = 0.75,
    duration = 1,
    stagger = 0.06,
    scatterX = 50,
    scatterY = 50,
    rotation = 25,
    ease = 'power2.out',
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

    // Split text into individual character spans
    text.split('').forEach((char) => {
      const span = document.createElement('span')
      span.textContent = char === ' ' ? '\u00A0' : char
      span.style.display = 'inline-block'
      container.appendChild(span)
      charsRef.current.push(span)
    })

    const chars = charsRef.current

    // Build animation timeline
    const timeline = gsap.timeline({
      onComplete,
    })

    timeline.from(chars, {
      x: () => gsap.utils.random(-scatterX, scatterX),
      y: () => gsap.utils.random(-scatterY, scatterY),
      opacity: 0,
      rotation: () => gsap.utils.random(-rotation, rotation),
      duration,
      stagger,
      delay,
      ease,
    })

    return () => {
      timeline.kill()

      if (container) {
        container.innerHTML = ''
      }

      charsRef.current = []
      // Note: Do NOT reset hasInitialized here - StrictMode cleanup would cause double animation
    }
  }, [enabled, text, delay, duration, stagger, scatterX, scatterY, rotation, ease, onComplete])

  return {
    containerRef,
    chars: charsRef.current,
  }
}

export default useScatterText
export type { ScatterConfig, ScatterResult }

