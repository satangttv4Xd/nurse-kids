// เสียงในเกม: เพลงพื้นหลัง (วนซ้ำ) + เสียงเอฟเฟกต์ตอนตอบคำถาม
// ตั้งค่าเปิด/ปิดและระดับเสียงได้ จำค่าไว้ในเครื่อง (localStorage)
import { useSyncExternalStore } from 'react'

export interface SoundSettings {
  musicOn: boolean
  musicVolume: number // 0–1
  sfxOn: boolean
  sfxVolume: number // 0–1
}

const KEY = 'littlesteps.sound'
// ค่าเริ่มต้นเบา ๆ ไม่ดังเกินไปสำหรับเด็ก
const DEFAULTS: SoundSettings = { musicOn: true, musicVolume: 0.25, sfxOn: true, sfxVolume: 0.6 }

function load(): SoundSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ใช้ค่าเริ่มต้น */ }
  return DEFAULTS
}

let settings = load()
const listeners = new Set<() => void>()

const bgm = typeof Audio !== 'undefined' ? new Audio('/assets/audio/bgm.mp3') : null
if (bgm) { bgm.loop = true; bgm.preload = 'auto' }

const SFX = { correct: '/assets/audio/correct.mp3', wrong: '/assets/audio/wrong.mp3' } as const
// ตอบไม่ถูก: เล่นเบากว่าเสียงตอบถูก เพื่อไม่ให้รู้สึกเหมือนโดนลงโทษ
const SFX_GAIN = { correct: 1, wrong: 0.5 } as const
let current: HTMLAudioElement | null = null

let unlocked = false // เบราว์เซอร์ให้เล่นเสียงได้หลังผู้ใช้แตะหน้าจอครั้งแรก

function applyMusic() {
  if (!bgm) return
  bgm.volume = settings.musicVolume
  if (settings.musicOn && settings.musicVolume > 0 && unlocked) bgm.play().catch(() => {})
  else bgm.pause()
}

export function setSound(patch: Partial<SoundSettings>) {
  settings = { ...settings, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* ไม่เป็นไร */ }
  applyMusic()
  listeners.forEach(l => l())
}

export function getSound() { return settings }

export function useSound(): SoundSettings {
  return useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l) }, getSound)
}

/** เรียกเมื่อผู้ใช้แตะหน้าจอ — เริ่มเพลงพื้นหลัง */
export function unlockAudio() {
  if (unlocked) return
  unlocked = true
  applyMusic()
}

export function playSfx(kind: keyof typeof SFX) {
  if (!settings.sfxOn || settings.sfxVolume <= 0) return
  current?.pause()
  const a = new Audio(SFX[kind])
  a.volume = Math.min(1, settings.sfxVolume * SFX_GAIN[kind])
  current = a
  // ลดเพลงพื้นหลังลงชั่วคราวระหว่างเสียงเอฟเฟกต์
  if (bgm && !bgm.paused) {
    bgm.volume = settings.musicVolume * 0.35
    a.addEventListener('ended', () => { if (current === a) bgm.volume = settings.musicVolume }, { once: true })
  }
  a.play().catch(() => {})
}

// หยุดเพลงเมื่อสลับแอป/แท็บ แล้วเล่นต่อเมื่อกลับมา
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) bgm?.pause()
    else applyMusic()
  })
  window.addEventListener('pointerdown', unlockAudio, { once: true })
  window.addEventListener('keydown', unlockAudio, { once: true })
}
