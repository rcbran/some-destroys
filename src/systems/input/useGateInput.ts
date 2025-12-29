import { useState } from 'react'

const TARGET = 'some destroys'

const useGateInput = () => {
  const [value, setValue] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  const handleUnlock = () => {
    if (value.trim().toLowerCase() === TARGET) {
      setUnlocked(true)
    }
  }

  return {
    value,
    setValue,
    unlocked,
    target: TARGET,
    handleUnlock,
  }
}

export default useGateInput
