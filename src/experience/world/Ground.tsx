const Ground = () => {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#050505" roughness={0.8} metalness={0.1} />
    </mesh>
  )
}

export default Ground
