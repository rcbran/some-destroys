import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import styles from './IntroGate.module.css'

// Animation mode toggle: 'scatter' | 'scramble'
type AnimationMode = 'scatter' | 'scramble'
export const ANIMATION_MODE = 'scramble' as AnimationMode

// Animation constants
export const TEXT_MESSAGE = 'Not all magic protects.'
const GLOW_RADIUS = 30 // pixels - proximity needed to trigger hot glow
const SCRAMBLE_CHARS = '◈◇◆▽△▷◁○●□■♦♢✧✦⬡⬢⟡⟐⌬⏣'
const SCRAMBLE_SPEED = 50 // ms between character changes
const SCRAMBLE_REVEAL_DURATION = 400 // ms before revealing final character

type UseIntroGateAnimationParams = {
  panelEl: HTMLDivElement | null
  inputRef: RefObject<HTMLInputElement | null>
  textRef: RefObject<HTMLSpanElement | null>
  moteRef: RefObject<HTMLDivElement | null>
}

/**
 * Hook that handles all GSAP animation logic for the IntroGate component.
 * Supports both 'scatter' and 'scramble' animation modes via ANIMATION_MODE toggle.
 */
const useIntroGateAnimation = ({
  panelEl,
  inputRef,
  textRef,
  moteRef,
}: UseIntroGateAnimationParams): void => {
  useEffect(() => {
    const inputEl = inputRef.current
    const textEl = textRef.current
    const moteEl = moteRef.current

    // Early return if panel or refs not ready
    if (!panelEl || !inputEl || !textEl || !moteEl) return

    // Get lead ember early - if missing, abort initialization
    const leadEmber = moteEl.querySelector('[data-ember]') as HTMLElement
    if (!leadEmber) return

    // Helper to get random scramble character
    const getRandomChar = () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]

    // Split text into individual character spans for animation
    const chars: HTMLSpanElement[] = []
    const finalChars: string[] = []
    TEXT_MESSAGE.split('').forEach((char) => {
      const span = document.createElement('span')
      const isSpace = char === ' '
      // Scramble starts with random chars, scatter shows actual text
      span.textContent = isSpace
        ? '\u00A0'
        : ANIMATION_MODE === 'scramble'
          ? getRandomChar()
          : char
      span.style.display = 'inline-block'
      textEl.appendChild(span)
      chars.push(span)
      finalChars.push(isSpace ? '\u00A0' : char)
    })

    // Track animation frame for cleanup
    let animationFrameId: number | undefined

    // Track scramble intervals and timeouts for cleanup
    const intervals: number[] = []
    const timeouts: number[] = []

    // Ensure input and mote start hidden
    gsap.set(inputEl, { autoAlpha: 0 })
    gsap.set(moteEl, { autoAlpha: 0 })

    // Track ember position and apply hot glow to characters as ember passes
    const updateTextGlow = () => {
      if (!leadEmber || !textEl) return

      const emberRect = leadEmber.getBoundingClientRect()
      const emberCenterX = emberRect.left + emberRect.width / 2

      // Check each character - once hot, it stays hot (skip for performance)
      for (const char of chars) {
        if (char.classList.contains(styles.hot)) continue

        const charRect = char.getBoundingClientRect()
        const charCenterX = charRect.left + charRect.width / 2
        const distance = Math.abs(emberCenterX - charCenterX)

        if (distance < GLOW_RADIUS) {
          char.classList.add(styles.hot)
        }
      }

      animationFrameId = requestAnimationFrame(updateTextGlow)
    }

    // Scramble effect: each character cycles through random glyphs then reveals
    const startScramble = () => {
      chars.forEach((span, index) => {
        const finalChar = finalChars[index]

        // Skip spaces
        if (finalChar === '\u00A0') return

        // Start scrambling after stagger delay (synchronized with fade-in)
        const startDelay = 750 + index * 60 // matches delay + stagger timing

        const startTimeout = window.setTimeout(() => {
          const intervalId = window.setInterval(() => {
            span.textContent = getRandomChar()
          }, SCRAMBLE_SPEED)
          intervals.push(intervalId)

          // Reveal final character after scramble duration
          const revealTimeout = window.setTimeout(() => {
            const idx = intervals.indexOf(intervalId)
            if (idx > -1) {
              window.clearInterval(intervalId)
              intervals.splice(idx, 1)
            }
            span.textContent = finalChar
          }, SCRAMBLE_REVEAL_DURATION)
          timeouts.push(revealTimeout)
        }, startDelay)
        timeouts.push(startTimeout)
      })
    }

    // Only start scramble if in scramble mode
    if (ANIMATION_MODE === 'scramble') {
      startScramble()
    }

    // Build animation timeline based on mode
    const timeline = gsap.timeline()

    if (ANIMATION_MODE === 'scatter') {
      // Scatter: characters fly in from random positions with rotation
      timeline.from(chars, {
        x: () => gsap.utils.random(-50, 50),
        y: () => gsap.utils.random(-50, 50),
        opacity: 0,
        rotation: () => gsap.utils.random(-25, 25),
        duration: 1,
        stagger: 0.06,
        delay: 0.75,
        ease: 'power2.out',
      })
    } else {
      // Scramble: clean fade-in (character cycling provides visual interest)
      timeline.from(chars, {
        opacity: 0,
        duration: 0.8,
        stagger: 0.05,
        delay: 0.75,
        ease: 'power1.out',
      })
    }

    // Fade mote in right after text finishes and start ember animation
    timeline.to(
      moteEl,
      {
        autoAlpha: 1,
        duration: 0.5,
        ease: 'power2.out',
        onStart: () => {
          const embers = moteEl.querySelectorAll('[data-ember]')
          embers.forEach((el) => {
            ;(el as HTMLElement).style.animationPlayState = 'running'
          })
          // Start tracking ember position once animation starts
          updateTextGlow()
        },
      },
      '+=0.2'
    )

    // Fade input in shortly after
    timeline.to(
      inputEl,
      {
        visibility: 'visible',
        opacity: 0.9,
        duration: 0.6,
        ease: 'power2.out',
      },
      '+=0.5'
    )

    // Cleanup function
    return () => {
      // Kill GSAP timeline
      timeline.kill()

      // Clear scramble intervals and timeouts
      intervals.forEach((id) => window.clearInterval(id))
      timeouts.forEach((id) => window.clearTimeout(id))

      // Cancel animation frame loop
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId)
      }

      // Remove hot glow classes from characters
      chars.forEach((char) => {
        char.classList.remove(styles.hot)
      })

      // Clear dynamically created character spans
      if (textEl) {
        textEl.innerHTML = ''
      }
    }
  }, [panelEl, inputRef, textRef, moteRef])
}

export default useIntroGateAnimation

