import { OrbitControls } from '@react-three/drei'
import Ground from '../../world/Ground'

const MainScene = () => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 6, 3]} intensity={1.1} />
      <Ground />
      <OrbitControls enableDamping />
    </>
  )
}

export default MainScene
