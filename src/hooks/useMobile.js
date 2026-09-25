import { useState, useEffect } from 'react'

export function useMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export function useMobileCanvasWidth() {
  const [width, setWidth] = useState(() =>
    window.innerWidth < 768 ? window.innerWidth - 16 : 680
  )
  useEffect(() => {
    const handler = () => {
      setWidth(window.innerWidth < 768 ? window.innerWidth - 16 : 680)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}
