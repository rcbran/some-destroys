import { Html } from '@react-three/drei'
import { useRef, useLayoutEffect, useState } from 'react'
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
  const [refsReady, setRefsReady] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const textRef = useRef<HTMLSpanElement | null>(null)

  // Callback ref for text span
  const handleTextRef = (node: HTMLSpanElement | null) => {
    textRef.current = node
    if (node && inputRef.current && !refsReady) {
      setRefsReady(true)
    }
  }

  // Callback ref for input
  const handleInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node
    if (node && textRef.current && !refsReady) {
      setRefsReady(true)
    }
  }

  useLayoutEffect(() => {
    if (!refsReady) {
      return
    }

    const inputEl = inputRef.current
    const textEl = textRef.current

    if (!inputEl || !textEl) {
      return
    }

    // Ensure a clean slate (important for StrictMode mount/unmount cycles)
    textEl.innerHTML = ''

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

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline()

      // Ensure input starts hidden. We'll reveal it after the text animation completes.
      gsap.set(inputEl, { autoAlpha: 0 })

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
        // Fade input in AFTER text finishes, with a 1s pause
        .to(
          inputEl,
          {
            autoAlpha: 1,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => {
              // inputEl.focus()
            },
          },
          '+=1'
        )
    }, textEl)

    return () => {
      ctx.revert()
      // Remove dynamically created spans so re-mounts start clean
      textEl.innerHTML = ''
    }
  }, [refsReady])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (value.trim().toLowerCase() === target) {
        onUnlock()
      }
    }
  }

  return (
    <Html fullscreen>
      <div className={styles.panel}>
        <label className={styles.prompt}>
          <span ref={handleTextRef} className={styles.promptText} />
          <input
            ref={handleInputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-label={`Unlock phrase: ${target}`}
            autoComplete="off"
            className={styles.input}
          />
        </label>
      </div>
    </Html>
  )
}

export default IntroGate
