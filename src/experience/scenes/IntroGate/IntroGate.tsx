import { Html } from '@react-three/drei'
import { useRef, useCallback, useState } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction, KeyboardEvent } from 'react'
import styles from './IntroGate.module.css'
import useIntroGateAnimation from './useIntroGateAnimation'

type IntroGateProps = {
  value: string
  setValue: Dispatch<SetStateAction<string>>
  target: string
  onUnlock: () => void
}

const IntroGate = ({ value, setValue, target, onUnlock }: IntroGateProps) => {
  // Track when panel element is mounted in the DOM via callback ref
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const moteRef = useRef<HTMLDivElement>(null)

  // Callback ref to detect when panel is mounted
  const panelRefCallback = useCallback((node: HTMLDivElement | null) => {
    setPanelEl(node)
  }, [])

  // All GSAP animation logic handled in separate hook
  useIntroGateAnimation({ panelEl, inputRef, textRef, moteRef })

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
      <div ref={panelRefCallback} className={styles.panel}>
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
