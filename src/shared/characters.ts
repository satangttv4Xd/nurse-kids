// รูปตัวละครชุด The Guardian's Journey (ตัดจาก /ตัวละครใหม่ เป็น PNG พื้นใส — ดู public/assets/characters2/meta.json)
import type { CharacterId } from './scenes'
import type { Emotion } from './story.types'

const base = '/assets/characters2'

/** อารมณ์ที่มีภาพหน้าแล้ว — อารมณ์อื่นจะใช้ภาพแรกในรายการแทน */
const FACES: Record<CharacterId, Emotion[]> = {
  mali: ['neutral', 'gentle', 'happy', 'curious', 'thinking', 'tired'],
  kai: ['neutral', 'happy', 'gentle', 'curious', 'thinking', 'tired'],
  pui: ['neutral', 'happy', 'curious', 'thinking', 'gentle'],
  mother: ['neutral', 'happy', 'gentle'],
  teacher: ['neutral', 'happy', 'gentle', 'thinking'],
}

export const bodyImage = (id: CharacterId) => `${base}/${id}/body.webp`

export function faceImage(id: CharacterId, emotion: Emotion = 'neutral') {
  const list = FACES[id]
  const fallback: Emotion = emotion === 'tired' ? 'gentle' : list[0]
  const e = list.includes(emotion) ? emotion : list.includes(fallback) ? fallback : list[0]
  return `${base}/${id}/face-${e}.webp`
}

/** ภาพครึ่งตัวตามอารมณ์ (ตัดจากท่าต่าง ๆ ในแผ่นอ้างอิง) — w = ความกว้างไฟล์, scale = ปรับให้หัวทุกภาพขนาดใกล้กัน */
type Bust = { w: number; h: number; scale: number }
const BUSTS: Record<CharacterId, Partial<Record<Emotion, Bust>>> = {
  mali: { neutral: { w: 556, h: 672, scale: 1.13 }, happy: { w: 568, h: 667, scale: 1.14 }, curious: { w: 639, h: 722, scale: 1.03 }, thinking: { w: 412, h: 726, scale: 1.05 }, gentle: { w: 443, h: 725, scale: 1.05 } },
  // ไค: ภาพทั้งตัว (สูง 900) — ย่อให้หัวขนาดใกล้มะลิ ส่วนล่างซ่อนใต้กล่องบทสนทนา · มีท่ากังวลสำหรับอารมณ์ไม่สบาย
  kai: { neutral: { w: 389, h: 900, scale: 1.05 }, happy: { w: 411, h: 900, scale: 1.05 }, gentle: { w: 421, h: 900, scale: 1.05 }, curious: { w: 328, h: 900, scale: 1.05 }, thinking: { w: 315, h: 900, scale: 1.05 }, tired: { w: 341, h: 900, scale: 1.05 } },
  pui: { neutral: { w: 460, h: 635, scale: 1.2 }, happy: { w: 412, h: 676, scale: 1.12 }, curious: { w: 519, h: 644, scale: 1.18 }, thinking: { w: 460, h: 607, scale: 1.25 }, gentle: { w: 427, h: 623, scale: 1.22 } },
  mother: { neutral: { w: 561, h: 889, scale: 0.85 }, happy: { w: 376, h: 692, scale: 1.1 }, gentle: { w: 376, h: 721, scale: 1.05 } },
  teacher: { neutral: { w: 561, h: 889, scale: 0.85 }, happy: { w: 527, h: 770, scale: 0.99 }, gentle: { w: 519, h: 717, scale: 1.06 }, thinking: { w: 295, h: 715, scale: 1.06 } },
}

export function bustImage(id: CharacterId, emotion: Emotion = 'neutral') {
  const set = BUSTS[id]
  // ไม่มีท่าครึ่งตัวสำหรับอารมณ์ไม่สบาย → ไม่แสดงภาพครึ่งตัว (ใช้สีหน้าในกรอบวงกลมแทน ดีกว่าใช้ท่ายิ้ม)
  if (emotion === 'tired' && !set.tired) return null
  const e: Emotion = set[emotion] ? emotion : 'neutral'
  const b = set[e]!
  // ให้ขอบล่างของภาพอยู่ใต้กล่องบทสนทนาเสมอ (กล่องเริ่มที่ y≈818) ภาพจะได้ไม่ลอย
  const height = b.h * b.scale
  const top = Math.round(Math.max(150, 900 - height))
  return { src: `${base}/${id}/bust-${e}.webp`, width: Math.round(b.w * b.scale), top, key: `${id}-${e}` }
}
