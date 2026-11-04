import type { CSSProperties } from 'react'

// กรอบเว้นว่างสำหรับรูปที่ยังทำไม่เสร็จ — แทนที่ด้วย <img> เมื่อได้ไฟล์จริง
export function Placeholder({ label, className = '', style }: { label: string; className?: string; style?: CSSProperties }) {
  return (
    <div className={`placeholder ${className}`} style={style}>
      <span>🖼️</span>
      <small>{label}</small>
    </div>
  )
}
