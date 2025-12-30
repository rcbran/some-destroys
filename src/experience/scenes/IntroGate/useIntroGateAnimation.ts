import { useEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import styles from './IntroGate.module.css'

// Text constants
const TEXT_PART_1 = 'Not all magic protects.'
const TEXT_PART_2 = 'some destroys.'

// Animation constants
const GLOW_RADIUS = 30 // pixels - proximity needed to trigger hot glow
const SCRAMBLE_CHARS = '◈◇◆▽△▷◁○●□■♦♢✧✦⬡⬢⟡⟐⌬⏣'

// Scatter animation settings (for first text)
const SCATTER_DURATION = 1
const SCATTER_STAGGER = 0.05
const SCATTER_DELAY = 0.5

// Beefed up scramble settings (for reveal text)
const SCRAMBLE_SPEED = 30 // faster scramble (was 50)
const SCRAMBLE_REVEAL_DURATION = 600 // longer reveal (was 400)
const SCRAMBLE_FADE_DURATION = 0.6
const SCRAMBLE_STAGGER = 0.04

// Timing between phases
const PAUSE_AFTER_SCATTER = 1500 // ms
const PAUSE_AFTER_SCRAMBLE = 2500 // ms

// Ash dissolve settings
const PARTICLES_PER_CHAR = 7
const PARTICLE_DURATION_MIN = 0.6
const PARTICLE_DURATION_MAX = 1.0

type UseIntroGateAnimationParams = {
  panelEl: HTMLDivElement | null
  text1Ref: RefObject<HTMLSpanElement | null>
  text2Ref: RefObject<HTMLSpanElement | null>
  moteRef: RefObject<HTMLDivElement | null>
  onComplete?: () => void
}

/**
 * Cinematic intro animation hook.
 * Sequence: scatter in text1 → pause → scramble in text2 → ember sweep → ash dissolve → onComplete
 */
const useIntroGateAnimation = ({
  panelEl,
  text1Ref,
  text2Ref,
  moteRef,
  onComplete,
}: UseIntroGateAnimationParams): void => {
  const dissolvedCharsRef = useRef<Set<HTMLSpanElement>>(new Set())
  const allCharsRef = useRef<HTMLSpanElement[]>([])
  const totalCharsRef = useRef(0)

  useEffect(() => {
    const text1El = text1Ref.current
    const text2El = text2Ref.current
    const moteEl = moteRef.current

    // Early return if refs not ready
    if (!panelEl || !text1El || !text2El || !moteEl) return

    // Get lead ember early - if missing, abort initialization
    const leadEmber = moteEl.querySelector('[data-ember]') as HTMLElement
    if (!leadEmber) return

    // Helper to get random scramble character
    const getRandomChar = () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]

    // Track cleanup
    let animationFrameId: number | undefined
    const intervals: number[] = []
    const timeouts: number[] = []
    const allChars: HTMLSpanElement[] = []

    // Reset refs
    dissolvedCharsRef.current = new Set()

    // === CREATE CHARACTER SPANS ===

    // Part 1: "Not all magic protects" - will scatter in
    const chars1: HTMLSpanElement[] = []
    TEXT_PART_1.split('').forEach((char) => {
      const span = document.createElement('span')
      const isSpace = char === ' '
      span.textContent = isSpace ? '\u00A0' : char
      span.style.display = 'inline-block'
      text1El.appendChild(span)
      chars1.push(span)
      allChars.push(span)
    })

    // Part 2: "some destroys" - will scramble in (starts hidden)
    const chars2: HTMLSpanElement[] = []
    const finalChars2: string[] = []
    TEXT_PART_2.split('').forEach((char) => {
      const span = document.createElement('span')
      const isSpace = char === ' '
      span.textContent = isSpace ? '\u00A0' : getRandomChar()
      span.style.display = 'inline-block'
      text2El.appendChild(span)
      chars2.push(span)
      finalChars2.push(isSpace ? '\u00A0' : char)
      allChars.push(span)
    })

    // Set chars2 to hidden initially - will be animated in later
    gsap.set(chars2, { autoAlpha: 0 })

    allCharsRef.current = allChars
    totalCharsRef.current = allChars.length

    // Ensure mote starts hidden
    gsap.set(moteEl, { autoAlpha: 0 })

    // === ASH DISSOLVE FUNCTION ===
    const dissolveChar = (charSpan: HTMLSpanElement, parentEl: HTMLElement) => {
      // Skip if already dissolved (double-check with both ref and data attribute)
      if (dissolvedCharsRef.current.has(charSpan)) return
      if (charSpan.dataset.dissolved === 'true') return
      dissolvedCharsRef.current.add(charSpan)
      charSpan.dataset.dissolved = 'true'

      const charRect = charSpan.getBoundingClientRect()
      const parentRect = parentEl.getBoundingClientRect()

      // Create particles for this character
      for (let i = 0; i < PARTICLES_PER_CHAR; i++) {
        const particle = document.createElement('div')
        particle.className = styles.ashParticle

        // Random position within character bounds
        const offsetX = gsap.utils.random(-3, charRect.width + 3)
        const offsetY = gsap.utils.random(-3, charRect.height + 3)

        particle.style.left = `${charRect.left - parentRect.left + offsetX}px`
        particle.style.top = `${charRect.top - parentRect.top + offsetY}px`

        parentEl.appendChild(particle)

        // Animate particle: scatter in random directions, rotate, scale, fade
        const duration = gsap.utils.random(PARTICLE_DURATION_MIN, PARTICLE_DURATION_MAX)
        const angle = gsap.utils.random(0, 360) * (Math.PI / 180)
        const distance = gsap.utils.random(20, 50)
        const driftX = Math.cos(angle) * distance
        const driftY = Math.sin(angle) * distance
        const rotation = gsap.utils.random(0, 360)

        gsap.to(particle, {
          y: driftY,
          x: driftX,
          rotation,
          scale: gsap.utils.random(0.2, 0.5),
          opacity: 0,
          duration,
          ease: 'power2.out',
          onComplete: () => {
            particle.remove()
          },
        })
      }

      // Hide the original character
      gsap.to(charSpan, {
        opacity: 0,
        scale: 0.8,
        duration: 0.15,
        ease: 'power1.out',
      })

      // Check if all chars dissolved
      if (dissolvedCharsRef.current.size >= totalCharsRef.current) {
        // Fade out the ember trail
        gsap.to(moteEl, {
          opacity: 0,
          duration: 1,
          ease: 'power2.out',
          delay: 0.3,
        })

        // Wait for particles and fade to finish, then call onComplete
        const completeTimeout = window.setTimeout(() => {
          onComplete?.()
        }, PARTICLE_DURATION_MAX * 1000 + 1200)
        timeouts.push(completeTimeout)
      }
    }

    // Track how many chars have been processed
    let processedCount = 0

    // === EMBER GLOW + DISSOLVE TRACKING ===
    const updateTextGlow = () => {
      if (!leadEmber) return

      // Stop processing if all characters are already marked
      if (processedCount >= allChars.length) {
        return
      }

      const emberRect = leadEmber.getBoundingClientRect()
      const emberCenterX = emberRect.left + emberRect.width / 2

      // Check chars1
      for (const char of chars1) {
        // Use data attribute to prevent double-processing
        if (char.dataset.processed === 'true') continue

        const charRect = char.getBoundingClientRect()
        const charCenterX = charRect.left + charRect.width / 2
        const distance = Math.abs(emberCenterX - charCenterX)

        if (distance < GLOW_RADIUS) {
          char.dataset.processed = 'true'
          processedCount++
          char.classList.add(styles.hot)
          // Trigger dissolve after brief hot moment
          const dissolveTimeout = window.setTimeout(() => {
            dissolveChar(char, text1El)
          }, 150)
          timeouts.push(dissolveTimeout)
        }
      }

      // Check chars2
      for (const char of chars2) {
        // Use data attribute to prevent double-processing
        if (char.dataset.processed === 'true') continue

        const charRect = char.getBoundingClientRect()
        const charCenterX = charRect.left + charRect.width / 2
        const distance = Math.abs(emberCenterX - charCenterX)

        if (distance < GLOW_RADIUS) {
          char.dataset.processed = 'true'
          processedCount++
          char.classList.add(styles.hot)
          // Trigger dissolve after brief hot moment
          const dissolveTimeout = window.setTimeout(() => {
            dissolveChar(char, text2El)
          }, 150)
          timeouts.push(dissolveTimeout)
        }
      }

      // Only continue animation loop if there are still characters to process
      if (processedCount < allChars.length) {
        animationFrameId = requestAnimationFrame(updateTextGlow)
      }
    }

    // === SCRAMBLE FUNCTION FOR TEXT 2 ===
    const startScramble = () => {
      chars2.forEach((span, index) => {
        const finalChar = finalChars2[index]

        // Skip spaces
        if (finalChar === '\u00A0') return

        // Immediate scramble start (synced with fade-in)
        const intervalId = window.setInterval(() => {
          span.textContent = getRandomChar()
        }, SCRAMBLE_SPEED)
        intervals.push(intervalId)

        // Reveal final character after scramble duration + stagger
        const revealDelay = index * (SCRAMBLE_STAGGER * 1000) + SCRAMBLE_REVEAL_DURATION
        const revealTimeout = window.setTimeout(() => {
          const idx = intervals.indexOf(intervalId)
          if (idx > -1) {
            window.clearInterval(intervalId)
            intervals.splice(idx, 1)
          }
          span.textContent = finalChar

          // Subtle scale pulse on reveal
          gsap.fromTo(
            span,
            { scale: 1.15 },
            { scale: 1, duration: 0.3, ease: 'power2.out' }
          )
        }, revealDelay)
        timeouts.push(revealTimeout)
      })
    }

    // === BUILD ANIMATION SEQUENCE ===
    const timeline = gsap.timeline()

    // Phase 1: Scatter in "Not all magic protects"
    // Use fromTo for explicit control over start and end states
    chars1.forEach((char) => {
      gsap.set(char, {
        x: gsap.utils.random(-50, 50),
        y: gsap.utils.random(-50, 50),
        rotation: gsap.utils.random(-25, 25),
        opacity: 0,
      })
    })

    timeline.to(chars1, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      duration: SCATTER_DURATION,
      stagger: SCATTER_STAGGER,
      delay: SCATTER_DELAY,
      ease: 'power2.out',
    })

    // Phase 2: Pause, then scramble in "some destroys"
    timeline.call(
      () => {
        startScramble()
      },
      [],
      `+=${PAUSE_AFTER_SCATTER / 1000}`
    )

    timeline.to(
      chars2,
      {
        autoAlpha: 1,
        duration: SCRAMBLE_FADE_DURATION,
        stagger: SCRAMBLE_STAGGER,
        ease: 'power1.out',
      },
      '<' // start at same time as scramble
    )

    // Phase 3: Pause, then fade in ember and start sweep + dissolve
    timeline.to(
      moteEl,
      {
        autoAlpha: 1,
        duration: 0.5,
        ease: 'power2.out',
        onStart: () => {
          // Reveal the world behind by fading background
          panelEl.classList.add(styles.revealed)

          const embers = moteEl.querySelectorAll('[data-ember]')
          embers.forEach((el) => {
            ;(el as HTMLElement).style.animationPlayState = 'running'
          })
          // Start tracking ember position for hot glow + dissolve
          updateTextGlow()
        },
      },
      `+=${PAUSE_AFTER_SCRAMBLE / 1000}`
    )

    // Cleanup function
    return () => {
      // Kill GSAP timeline
      timeline.kill()

      // Clear intervals and timeouts
      intervals.forEach((id) => window.clearInterval(id))
      timeouts.forEach((id) => window.clearTimeout(id))

      // Cancel animation frame loop
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId)
      }

      // Remove hot glow classes
      allChars.forEach((char) => {
        char.classList.remove(styles.hot)
      })

      // Clear dynamically created character spans
      if (text1El) {
        text1El.innerHTML = ''
      }
      if (text2El) {
        text2El.innerHTML = ''
      }

      // Reset refs
      dissolvedCharsRef.current = new Set()
      allCharsRef.current = []
    }
  }, [panelEl, text1Ref, text2Ref, moteRef, onComplete])
}

export default useIntroGateAnimation
