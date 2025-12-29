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

const IntroGate = ({ value, setValue, target, onUnlock }: IntroGateProps) => {
  const [mounted, setMounted] = useState(false)
  const hasInitialized = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const moteRef = useRef<HTMLDivElement>(null)

  // Set mounted after first render with a small delay to ensure Html portal is ready
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const inputEl = inputRef.current
    const textEl = textRef.current
    const moteEl = moteRef.current

    if (!inputEl || !textEl || !moteEl) return

    // Prevent double-run in StrictMode
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Split text into individual characters
    const message = 'Not all magic protects.'
    const chars: HTMLSpanElement[] = []

    message.split('').forEach((char) => {
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

    // Random scatter animation with initial delay
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
          },
        },
        '+=0.2'
      )
      // Fade input in shortly after
      .to(
        inputEl,
        {
          autoAlpha: 1,
          duration: 0.6,
          ease: 'power2.out',
        },
        '+=0.5'
      )

    return () => {
      timeline.kill()
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
