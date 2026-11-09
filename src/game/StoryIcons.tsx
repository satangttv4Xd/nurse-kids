// ไอคอนวาดเอง (SVG) แทนอีโมจิในเนื้อเรื่อง — หน้าตาเหมือนกันทุกเครื่อง/ทุกเบราว์เซอร์
// story.json ยังเก็บอีโมจิไว้เป็น "รหัส" ของไอคอนเหมือนเดิม (ไม่แก้เนื้อเรื่อง) แล้วแปลงเป็นรูปวาดตรงนี้
// เส้นใช้ currentColor (ทอง) · สีเน้นใช้ --icon-accent (เขียวอมฟ้า)
import type { ReactNode } from 'react'

const A = 'var(--icon-accent, #9fdcd2)'

const draw = (size: number, children: ReactNode, className?: string) => (
  <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={3.5}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">{children}</svg>
)

/* ---------- ตราผู้พิทักษ์ 4 ดินแดน ---------- */
const hourglass = <>
  <path d="M16 8h32M16 56h32" strokeWidth={4.5} />
  <path d="M20 8c0 12 9 16 12 24-3 8-12 12-12 24M44 8c0 12-9 16-12 24 3 8 12 12 12 24" />
  <path d="M24 17h16c-1.5 5-5 8-8 11-3-3-6.5-6-8-11z" fill={A} stroke="none" />
  <path d="M23 52c1-6 5-9 9-11 4 2 8 5 9 11z" fill={A} stroke="none" />
  <path d="M32 33v6" stroke={A} />
</>

const shieldMoon = <>
  <path d="M32 6l20 7v16c0 14-8.5 23-20 29C20.5 52 12 43 12 29V13z" />
  <path d="M38 20a12 12 0 1 0 0 22 10 10 0 0 1 0-22z" fill={A} stroke="none" />
  <path d="M43 22l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="currentColor" strokeWidth={1.5} />
</>

const crystal = <>
  <path d="M20 10h24l12 14-24 32L8 24z" />
  <path d="M8 24h48M20 10l6 14 6 32M44 10l-6 14-6 32M26 24l6-14 6 14" strokeWidth={2.5} />
  <path d="M26 24h12l-6 32z" fill={A} stroke="none" opacity={0.9} />
</>

const bell = <>
  <path d="M32 7v5" />
  <path d="M17 44c3-4 3-8 3-15a12 12 0 0 1 24 0c0 7 0 11 3 15z" />
  <path d="M12 44h40" strokeWidth={4.5} />
  <circle cx="32" cy="51" r="5" fill={A} stroke="none" />
  <path d="M25 24c1-3 3-5 6-6" stroke={A} />
</>

/* ---------- สิ่งของในฉากสำรวจ ---------- */
const alarmClock = <>
  <circle cx="32" cy="35" r="18" />
  <path d="M32 24v11l7 5" stroke={A} />
  <path d="M10 18a9 9 0 0 1 12-9M54 18a9 9 0 0 0-12-9" />
  <path d="M19 51l-4 5M45 51l4 5" />
</>

const pillBox = <>
  <rect x="8" y="22" width="48" height="26" rx="5" />
  <path d="M8 31h48M24 22v26M40 22v26" strokeWidth={2.5} />
  <path d="M12 22l3-8h34l3 8" />
  <circle cx="16" cy="40" r="3" fill={A} stroke="none" />
  <circle cx="32" cy="40" r="3" fill={A} stroke="none" />
  <circle cx="48" cy="40" r="3" fill={A} stroke="none" />
</>

const waterGlass = <>
  <path d="M16 10h32l-4 44H20z" />
  <path d="M18.5 28c4 2 8 2 13.5 0s9.5-2 13.5 0L44 54H20z" fill={A} stroke="none" opacity={0.85} />
  <path d="M22 16l1 8" strokeWidth={2.5} />
</>

const calendar = <>
  <rect x="9" y="13" width="46" height="42" rx="5" />
  <path d="M9 25h46M21 8v10M43 8v10" />
  <path d="M18 34h4M30 34h4M42 34h4M18 44h4M30 44h4" strokeWidth={4} />
  <circle cx="44" cy="45" r="5" fill={A} stroke="none" />
</>

const stethoscope = <>
  <path d="M16 8v14a12 12 0 0 0 24 0V8" />
  <path d="M12 8h8M36 8h8" />
  <path d="M28 34v6a10 10 0 0 0 20 0v-6" />
  <circle cx="48" cy="29" r="6" fill={A} />
</>

const tent = <>
  <path d="M6 54L32 12l26 42z" />
  <path d="M32 12L20 54M32 12l12 42" strokeWidth={2.5} />
  <path d="M26 54l6-16 6 16z" fill={A} stroke="none" />
  <path d="M32 12l-4-6M32 12l4-6" />
  <path d="M4 54h56" />
</>

const moon = <>
  <path d="M40 10a22 22 0 1 0 14 34A18 18 0 0 1 40 10z" fill={A} fillOpacity={0.35} />
  <path d="M50 12l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="currentColor" strokeWidth={1.5} />
  <circle cx="56" cy="30" r="1.8" fill="currentColor" stroke="none" />
</>

const tablet = <>
  <rect x="10" y="8" width="44" height="48" rx="6" />
  <rect x="16" y="14" width="32" height="32" rx="2" fill={A} fillOpacity={0.35} strokeWidth={2.5} />
  <path d="M28 51h8" />
</>

const tree = <>
  <path d="M32 58V38M32 46l-8-6M32 42l7-6" />
  <path d="M32 6c9 0 15 6 15 12 6 2 9 7 8 13-1 7-7 10-14 9H23c-7 1-13-2-14-9-1-6 2-11 8-13 0-6 6-12 15-12z" fill={A} fillOpacity={0.35} />
  <path d="M22 58h20" />
</>

const waterCooler = <>
  <path d="M22 6h20v8c0 3-3 5-10 5s-10-2-10-5z" fill={A} fillOpacity={0.55} />
  <path d="M28 19v4M36 19v4" strokeWidth={2.5} />
  <rect x="16" y="23" width="32" height="35" rx="4" />
  <path d="M26 33h12M32 33v5" />
  <path d="M32 43c-2 3-3 4.5-3 6a3 3 0 0 0 6 0c0-1.5-1-3-3-6z" fill={A} stroke="none" />
</>

const hospital = <>
  <rect x="8" y="12" width="48" height="36" rx="5" />
  <path d="M28 18h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill={A} stroke="none" />
  <path d="M20 48v10M44 48v10" />
</>

const floor = <>
  <path d="M6 50l12-26h28l12 26z" />
  <path d="M14 33h36M10 42h44M25 24l-4 26M39 24l4 26M32 24v26" strokeWidth={2.5} />
  <path d="M26 33h6v9h-7z" fill={A} stroke="none" opacity={0.8} />
</>

const teacher = <>
  <rect x="30" y="8" width="28" height="22" rx="3" />
  <path d="M35 15h18M35 21h12" stroke={A} strokeWidth={2.5} />
  <circle cx="18" cy="22" r="8" />
  <path d="M4 56c0-12 6-19 14-19s14 7 14 19" />
  <path d="M26 42l14-10" />
</>

const sofa = <>
  <path d="M14 30V22a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v8" />
  <path d="M8 30a5 5 0 0 1 6 5v5h36v-5a5 5 0 0 1 10 0v13H4V35a5 5 0 0 1 4-5z" />
  <path d="M14 40v-4c0-3 2-5 5-5h26c3 0 5 2 5 5v4z" fill={A} fillOpacity={0.55} stroke="none" />
  <path d="M10 48v6M54 48v6" />
</>

const stairs = <>
  <path d="M6 56h12V44h12V32h12V20h12V8" />
  <path d="M6 56V48M58 8v48H6" strokeWidth={2.5} />
  <path d="M46 26l6-6m0 0h-5m5 0v5" stroke={A} />
</>

const cushion = <>
  <path d="M10 22c6-4 14-6 22-6s16 2 22 6c2 7 2 13 0 20-6 4-14 6-22 6s-16-2-22-6c-2-7-2-13 0-20z" fill={A} fillOpacity={0.35} />
  <circle cx="22" cy="32" r="2" fill="currentColor" stroke="none" />
  <circle cx="32" cy="32" r="2" fill="currentColor" stroke="none" />
  <circle cx="42" cy="32" r="2" fill="currentColor" stroke="none" />
  <path d="M10 22l-4-4M54 22l4-4M10 42l-4 4M54 42l4 4" strokeWidth={2.5} />
</>

const mapBoard = <>
  <path d="M6 14l16-6 20 6 16-6v42l-16 6-20-6-16 6z" />
  <path d="M22 8v42M42 14v42" strokeWidth={2.5} />
  <path d="M12 38c6-2 8-10 16-10s8 8 14 4" stroke={A} strokeDasharray="1 5" />
  <path d="M48 24l4 4m0-4l-4 4" stroke={A} />
</>

const notebook = <>
  <rect x="12" y="6" width="40" height="52" rx="4" />
  <path d="M20 6v52" strokeWidth={2.5} />
  <path d="M8 16h8M8 28h8M8 40h8" strokeWidth={2.5} />
  <path d="M36 18l3 6 6.5 1-4.75 4.5 1.25 6.5-6-3.2-6 3.2 1.25-6.5L26.5 25l6.5-1z" fill={A} stroke="none" />
</>

const crayons = <>
  <path d="M10 50L40 20l6-2-2 6-30 30z" />
  <path d="M40 20l4 4" strokeWidth={2.5} />
  <path d="M20 56l26-26 6-2-2 6-26 26" fill={A} fillOpacity={0.45} />
  <path d="M8 52l4 4" />
</>

const bulb = <>
  <path d="M24 42c0-6-8-9-8-19a16 16 0 0 1 32 0c0 10-8 13-8 19z" fill={A} fillOpacity={0.35} />
  <path d="M24 49h16M27 56h10" />
  <path d="M32 30v-6M28 26l4 4 4-4" strokeWidth={2.5} />
</>

/** อีโมจิในเนื้อเรื่อง → รูปวาด (ตัดตัวเลือกรูปแบบ FE0F ออกก่อนจับคู่) */
const ICONS: Record<string, ReactNode> = {
  '⏳': hourglass, '🛡': shieldMoon, '💎': crystal, '🔔': bell,
  '⏰': alarmClock, '💊': pillBox, '🥛': waterGlass, '📅': calendar, '🩺': stethoscope,
  '⛺': tent, '🌙': moon, '📱': tablet, '🌳': tree, '🚰': waterCooler, '🏥': hospital,
  '🟫': floor, '👩‍🏫': teacher, '🛋': sofa, '🚪': stairs, '☁': cushion,
  '🗺': mapBoard, '📒': notebook, '🖍': crayons, '💡': bulb,
}

const norm = (icon: string) => icon.replace(/️/g, '').trim()

/** ไอคอนของเนื้อเรื่อง — ถ้ายังไม่มีรูปวาด จะแสดงอีโมจิเดิมไว้ก่อน (ไม่ให้หายไปเฉย ๆ) */
export function StoryIcon({ icon, size = 48, className }: { icon: string; size?: number; className?: string }) {
  const shape = ICONS[norm(icon)]
  return shape ? draw(size, shape, className) : <span className={className}>{icon}</span>
}

/** ตัดอีโมจิที่นำหน้าข้อความออก (เช่น หัวข้อในหน้าความทรงจำ "⏳ ยอดนัก…") */
export const stripLeadingEmoji = (text: string) => text.replace(/^[\p{Extended_Pictographic}️‍]+\s*/u, '')
