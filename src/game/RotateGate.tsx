import { useEffect, useState, type ReactNode } from 'react'

// บังคับแนวนอน: ถ้าจอเป็นแนวตั้ง แสดงหน้าขอให้หมุนเครื่อง
const isPortrait = () => window.matchMedia('(orientation: portrait)').matches

export function RotateGate({ children }: { children: ReactNode }) {
  const [portrait, setPortrait] = useState(isPortrait)
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)')
    const on = () => setPortrait(mq.matches)
    mq.addEventListener('change', on)
    window.addEventListener('resize', on)
    return () => {
      mq.removeEventListener('change', on)
      window.removeEventListener('resize', on)
    }
  }, [])

  return (
    <>
      {children}
      {portrait && (
        <div className="rotate-gate" role="alert">
          <div className="rotate-phone" aria-hidden>📱</div>
          <p>กรุณาหมุนเครื่องเป็นแนวนอน</p>
          <small>เกมนี้เล่นในแนวนอน</small>
        </div>
      )}
    </>
  )
}

// เรียกตอนผู้เล่นกดปุ่ม (ต้องมี user gesture) — เข้าเต็มจอและล็อกแนวนอนบน Android
export async function enterLandscapeFullscreen() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    }
    const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
    await o.lock?.('landscape')
  } catch {
    // iOS Safari ไม่รองรับการล็อก → ใช้หน้า RotateGate แทน
  }
}
