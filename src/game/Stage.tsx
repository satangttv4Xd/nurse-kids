import { useEffect, useState, type ReactNode } from 'react'

// เวที 1920×1080 คงที่ ย่อ/ขยายให้พอดีจอแบบ letterbox
export const STAGE_W = 1920
export const STAGE_H = 1080

export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => {
      const vw = window.visualViewport?.width ?? window.innerWidth
      const vh = window.visualViewport?.height ?? window.innerHeight
      setScale(Math.min(vw / STAGE_W, vh / STAGE_H))
    }
    fit()
    window.addEventListener('resize', fit)
    window.visualViewport?.addEventListener('resize', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.visualViewport?.removeEventListener('resize', fit)
    }
  }, [])
  return (
    <div className="stage-wrap">
      <div className="stage" style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}
