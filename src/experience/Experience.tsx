import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import IntroGate from './scenes/IntroGate/IntroGate'
import MainScene from './scenes/MainScene/MainScene'
import PostFX from '../systems/post/PostFX.tsx'
import useGateInput from '../systems/input/useGateInput'

const Experience = () => {
  const gate = useGateInput()

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 45, position: [0, 1.2, 6] }}
    >
      <Suspense fallback={null}>
        {gate.unlocked ? (
          <MainScene />
        ) : (
          <IntroGate
            value={gate.value}
            setValue={gate.setValue}
            target={gate.target}
            onUnlock={gate.handleUnlock}
          />
        )}
        <PostFX />
      </Suspense>
    </Canvas>
  )
}

export default Experience
