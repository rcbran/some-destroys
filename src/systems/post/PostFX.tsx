import { Bloom, EffectComposer } from '@react-three/postprocessing'

const PostFX = () => {
  return (
    <EffectComposer>
      <Bloom intensity={0.4} luminanceThreshold={0.1} luminanceSmoothing={0.85} mipmapBlur />
    </EffectComposer>
  )
}

export default PostFX
