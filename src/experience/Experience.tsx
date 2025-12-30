import { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import IntroGate from './scenes/IntroGate/IntroGate'
import MainScene from './scenes/MainScene/MainScene'
import PostFX from '../systems/post/PostFX.tsx'

const Experience = () => {
  const [introComplete, setIntroComplete] = useState(false)

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true)
  }, [])

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 45, position: [0, 1.2, 6] }}
    >
      <Suspense fallback={null}>
        {/* Always render MainScene so world is visible behind intro */}
        <MainScene />
        {/* IntroGate overlay - unmounts after animation completes */}
        {!introComplete && <IntroGate onUnlock={handleIntroComplete} />}
        <PostFX />
      </Suspense>
    </Canvas>
  )
}

export default Experience
