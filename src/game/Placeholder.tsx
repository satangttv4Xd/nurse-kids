import type { CSSProperties } from 'react'

// กรอบเว้นว่างสำหรับรูปที่ยังทำไม่เสร็จ — แทนที่ด้วย <img> เมื่อได้ไฟล์จริง
export function Placeholder({ label, className = '', style }: { label: string; className?: string; style?: CSSProperties }) {
  return (
    <div className={`placeholder ${className}`} style={style}>
      <svg width="64" height="64" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="6" y="9" width="36" height="30" rx="4" />
        <circle cx="17" cy="19" r="3.5" />
        <path d="M8 35l11-11 8 8 5-5 9 9" />
      </svg>
      <small>{label}</small>
    </div>
  )
}
