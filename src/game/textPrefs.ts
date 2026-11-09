// ตั้งค่ากล่องบทสนทนา: ความเร็วตัวอักษร + เล่นอัตโนมัติ (ปิดเป็นค่าเริ่มต้น) — จำค่าไว้ในเครื่อง
import { useSyncExternalStore } from 'react'

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant'
export interface TextPrefs { speed: TextSpeed; auto: boolean }

export const SPEED_MS: Record<TextSpeed, number> = { slow: 55, normal: 32, fast: 16, instant: 0 }
export const SPEED_LABEL: Record<TextSpeed, string> = { slow: 'ช้า', normal: 'ปกติ', fast: 'เร็ว', instant: 'ทันที' }

const KEY = 'littlesteps.text'
const DEFAULTS: TextPrefs = { speed: 'normal', auto: false }

function load(): TextPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ใช้ค่าเริ่มต้น */ }
  return DEFAULTS
}

let prefs = load()
const listeners = new Set<() => void>()

export function setTextPrefs(patch: Partial<TextPrefs>) {
  prefs = { ...prefs, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* ไม่เป็นไร */ }
  listeners.forEach(l => l())
}

export function useTextPrefs(): TextPrefs {
  return useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l) }, () => prefs)
}

/** แยกข้อความเป็นหน่วยตัวอักษรที่มองเห็น (สระ/วรรณยุกต์ไทยติดกับพยัญชนะ ไม่โผล่ลอยทีละตัว) */
export function graphemes(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment: (t: string) => Iterable<{ segment: string }> } }).Segmenter
  if (Seg) return Array.from(new Seg('th', { granularity: 'grapheme' }).segment(text), s => s.segment)
  return Array.from(text)
}
