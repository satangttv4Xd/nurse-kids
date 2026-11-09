// ไอคอน SVG ของหน้าเมนู (ไม่ใช้อีโมจิ) — สีตาม currentColor
type P = { size?: number }
const svg = (size: number, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={4.5}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">{children}</svg>
)

export const PlayIcon = ({ size = 48 }: P) => svg(size,
  <path d="M17 11.5c0-2 2.2-3.2 3.9-2.1l16.2 10.5c1.6 1 1.6 3.3 0 4.3L20.9 34.7c-1.7 1.1-3.9-.1-3.9-2.1z" fill="currentColor" />)

export const GearIcon = ({ size = 48 }: P) => svg(size, <>
  <path d="M24 5.5l3.4 4.6 5.6-1.3 1.3 5.6 4.6 3.4-2.6 5.2 2.6 5.2-4.6 3.4-1.3 5.6-5.6-1.3L24 42.5l-3.4-4.6-5.6 1.3-1.3-5.6-4.6-3.4 2.6-5.2-2.6-5.2 4.6-3.4 1.3-5.6 5.6 1.3z" fill="currentColor" strokeWidth={3} />
  <circle cx="24" cy="24" r="6" fill="var(--icon-hole, #fff)" stroke="none" />
</>)

export const BookIcon = ({ size = 48 }: P) => svg(size, <>
  <path d="M8 10.5c5.5-1.5 11 -.5 16 3v26c-5-3.5-10.5-4.5-16-3z" fill="currentColor" />
  <path d="M40 10.5c-5.5-1.5-11-.5-16 3v26c5-3.5 10.5-4.5 16-3z" fill="currentColor" />
</>)

export const ReplayIcon = ({ size = 48 }: P) => svg(size, <>
  <path d="M11 24a13 13 0 1 0 4-9.4" />
  <path d="M10 8v8h8" />
</>)

export const AutoPlayIcon = ({ size = 48 }: P) => svg(size, <>
  <path d="M7 13.5v21c0 1.6 1.8 2.5 3.1 1.6L24 26v8.5c0 1.6 1.8 2.5 3.1 1.6l14-10.5c1-.8 1-2.4 0-3.2l-14-10.5C25.8 10.9 24 11.9 24 13.5V22l-13.9-10.1C8.8 11 7 11.9 7 13.5z" fill="currentColor" strokeWidth={2} />
</>)

export const TabletIcon = ({ size = 48 }: P) => svg(size, <>
  <rect x="12" y="5" width="24" height="38" rx="4" />
  <path d="M21 37h6" />
</>)

export const MusicIcon = ({ size = 48 }: P) => svg(size, <>
  <path d="M19 34V12l18-4v22" />
  <circle cx="14" cy="34" r="5" fill="currentColor" />
  <circle cx="32" cy="30" r="5" fill="currentColor" />
</>)

export const SpeakerIcon = ({ size = 48 }: P) => svg(size, <>
  <path d="M8 19v10h7l10 8V11l-10 8z" fill="currentColor" />
  <path d="M31 18c2 1.8 2 10.2 0 12" />
  <path d="M36 13c4.5 4 4.5 18 0 22" />
</>)

export const PauseIcon = ({ size = 48 }: P) => svg(size, <>
  <rect x="13" y="10" width="7" height="28" rx="2.5" fill="currentColor" stroke="none" />
  <rect x="28" y="10" width="7" height="28" rx="2.5" fill="currentColor" stroke="none" />
</>)

export const BulbIcon = ({ size = 48 }: P) => svg(size, <>
  <path d="M24 6a12 12 0 0 0-7 21.8c1.3 1 2 2.4 2 4V34h10v-2.2c0-1.6.7-3 2-4A12 12 0 0 0 24 6z" fill="currentColor" strokeWidth={3} />
  <path d="M19 39h10M21 43h6" />
</>)

export const HelpHandsIcon = ({ size = 48 }: P) => svg(size, <>
  <path d="M6 24l8-8 6 3 4-3 4 3 6-3 8 8" />
  <path d="M14 28l6 6c1.5 1.5 3.5 1.5 5 0l9-9" />
  <path d="M18 32l-2 2M22 36l-2 2" />
</>)

export const TapIcon = ({ size = 48 }: P) => svg(size, <>
  <path d="M20 26V10a3 3 0 0 1 6 0v12l8 2.2c2.2.6 3.5 2.8 3 5L35 38c-.4 2-2.2 3.5-4.3 3.5H24c-1.4 0-2.7-.6-3.6-1.7L13 31c-1.2-1.5-1-3.6.4-4.8 1.4-1.2 3.4-1 4.6.3z" fill="currentColor" strokeWidth={3} />
</>)

export const BackIcon = ({ size = 48 }: P) => svg(size, <path d="M30 10L16 24l14 14" strokeWidth={6} />)

export const PenIcon = ({ size = 48 }: P) => svg(size, <>
  <path d="M32 8l8 8-21 21-10 2 2-10z" fill="currentColor" strokeWidth={3} />
  <path d="M28 12l8 8" stroke="var(--icon-hole, #14203a)" strokeWidth={3} />
</>)

export const StarIcon = ({ size = 48 }: P) => svg(size,
  <path d="M24 5l5.6 11.6 12.8 1.7-9.3 8.9 2.3 12.6L24 33.7l-11.4 6.1 2.3-12.6-9.3-8.9 12.8-1.7z" fill="currentColor" strokeWidth={2.5} />)

export const CheckIcon = ({ size = 48 }: P) => svg(size, <path d="M11 25l9 9 17-19" strokeWidth={6} />)
