import { Html } from '@react-three/drei'
import { useRef, useCallback, useState } from 'react'
import styles from './IntroGate.module.css'
import useIntroGateAnimation from './useIntroGateAnimation'

type IntroGateProps = {
  onUnlock: () => void
}

const IntroGate = ({ onUnlock }: IntroGateProps) => {
  // Track when panel element is mounted in the DOM via callback ref
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null)
  const text1Ref = useRef<HTMLSpanElement>(null)
  const text2Ref = useRef<HTMLSpanElement>(null)
  const moteRef = useRef<HTMLDivElement>(null)

  // Callback ref to detect when panel is mounted
  const panelRefCallback = useCallback((node: HTMLDivElement | null) => {
    setPanelEl(node)
  }, [])

  // All GSAP animation logic handled in separate hook
  // Cinematic sequence auto-transitions via onComplete
  useIntroGateAnimation({
    panelEl,
    text1Ref,
    text2Ref,
    moteRef,
    onComplete: onUnlock,
  })

  return (
    <Html fullscreen>
      <div ref={panelRefCallback} className={styles.panel}>
        <div className={styles.prompt}>
          <span ref={text1Ref} className={styles.promptText} />
          <span ref={text2Ref} className={styles.promptTextReveal} />
          <div ref={moteRef} className={styles.mote} aria-hidden="true">
            <div className={styles.trail}>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className={styles.ember} data-ember />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Html>
  )
}

export default IntroGate
