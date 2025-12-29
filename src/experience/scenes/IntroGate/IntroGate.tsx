import { Html } from '@react-three/drei'
import { useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'
import type { ChangeEvent, Dispatch, SetStateAction, KeyboardEvent } from 'react'
import styles from './IntroGate.module.css'

type IntroGateProps = {
  value: string
  setValue: Dispatch<SetStateAction<string>>
  target: string
  onUnlock: () => void
}

// Animation constants
const TEXT_MESSAGE = 'Not all magic protects.'
const GLOW_RADIUS = 30 // pixels - proximity needed to trigger hot glow
const PORTAL_READY_DELAY = 50 // ms - delay for Html portal to mount

const IntroGate = ({ value, setValue, target, onUnlock }: IntroGateProps) => {
  const [mounted, setMounted] = useState(false)
  const hasInitialized = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const moteRef = useRef<HTMLDivElement>(null)

  // Wait for Html portal to mount before initializing animations
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), PORTAL_READY_DELAY)
    return () => clearTimeout(timer)
  }, [])

  // Main animation effect - runs once when mounted
  useEffect(() => {
    if (!mounted) return

    const inputEl = inputRef.current
    const textEl = textRef.current
    const moteEl = moteRef.current

    // Early return if refs not ready
    if (!inputEl || !textEl || !moteEl) return

    // Prevent double-run in StrictMode
    if (hasInitialized.current) return

    // Get lead ember early - if missing, abort initialization
    const leadEmber = moteEl.querySelector('[data-ember]') as HTMLElement
    if (!leadEmber) return

    // Mark as initialized only after all checks pass
    hasInitialized.current = true

    // Split text into individual character spans for animation
    const chars: HTMLSpanElement[] = []
    TEXT_MESSAGE.split('').forEach((char) => {
      const span = document.createElement('span')
      span.textContent = char === ' ' ? '\u00A0' : char
      span.style.display = 'inline-block'
      textEl.appendChild(span)
      chars.push(span)
    })

    const timeline = gsap.timeline()

    // Ensure input and mote start hidden
    gsap.set(inputEl, { autoAlpha: 0 })
    gsap.set(moteEl, { autoAlpha: 0 })

    // Track ember position and apply hot glow to characters as ember passes
    let animationFrameId: number | undefined
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

    // Build animation timeline: text scatter → ember fade-in → input fade-in
    timeline
      .from(chars, {
        x: () => gsap.utils.random(-50, 50),
        y: () => gsap.utils.random(-50, 50),
        opacity: 0,
        rotation: () => gsap.utils.random(-25, 25),
        duration: 1,
        stagger: 0.06,
        delay: 0.75,
        ease: 'power2.out',
      })
      // Fade mote in right after text finishes and start ember animation
      .to(
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
      .to(
        inputEl,
        {
          visibility: 'visible',
          opacity: 0.9,
          duration: 0.6,
          ease: 'power2.out',
        },
        '+=0.5'
      )

    return () => {
      // Kill GSAP timeline
      timeline.kill()

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

      // Reset flag to allow animation replay on remount
      hasInitialized.current = false
    }
  }, [mounted])

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value)
    },
    [setValue]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        if (value.trim().toLowerCase() === target) {
          onUnlock()
        }
      }
    },
    [value, target, onUnlock]
  )

  return (
    <Html fullscreen>
      <div className={styles.panel}>
        <label className={styles.prompt}>
          <span ref={textRef} className={styles.promptText} />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-label={`Unlock phrase: ${target}`}
            autoComplete="off"
            className={styles.input}
          />
          <div ref={moteRef} className={styles.mote} aria-hidden="true">
            <div className={styles.trail}>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className={styles.ember} data-ember />
              ))}
            </div>
          </div>
        </label>
      </div>
    </Html>
  )
}

export default IntroGate
