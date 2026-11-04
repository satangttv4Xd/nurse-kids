// รูปตัวละคร (ตัดจากแผ่นอ้างอิงใน /ตัวละคร เป็น PNG พื้นใส)
import type { CharacterId } from './scenes'
import type { Emotion } from './story.types'

const base = '/assets/characters'

/** อารมณ์ที่มีภาพหน้าแล้ว — อารมณ์อื่นจะใช้ภาพแรกในรายการแทน */
const FACES: Record<CharacterId, Emotion[]> = {
  mali: ['neutral', 'happy', 'curious', 'gentle', 'tired', 'thinking'],
  pui: ['neutral', 'happy', 'curious', 'gentle', 'thinking'],
  mother: ['happy', 'gentle'],
  teacher: ['happy', 'gentle'],
}

export const bodyImage = (id: CharacterId) => `${base}/${id}/body.png`

export function faceImage(id: CharacterId, emotion: Emotion = 'neutral') {
  const list = FACES[id]
  const fallback: Emotion = emotion === 'tired' ? 'gentle' : list[0]
  const e = list.includes(emotion) ? emotion : list.includes(fallback) ? fallback : list[0]
  return `${base}/${id}/face-${e}.png`
}

/** ภาพครึ่งตัวตามอารมณ์ (ตัดจากท่าต่าง ๆ ในแผ่นอ้างอิง) — w = ความกว้างไฟล์, scale = ปรับให้หัวทุกภาพขนาดใกล้กัน */
type Bust = { w: number; h: number; scale: number }
const BUSTS: Record<CharacterId, Partial<Record<Emotion, Bust>>> = {
  mali: {
    neutral: { w: 340, h: 563, scale: 0.93 }, gentle: { w: 280, h: 461, scale: 1.36 }, curious: { w: 408, h: 479, scale: 1.28 },
    happy: { w: 288, h: 329, scale: 1.55 }, thinking: { w: 225, h: 352, scale: 1.32 }, tired: { w: 221, h: 359, scale: 1.32 },
  },
  pui: {
    neutral: { w: 393, h: 705, scale: 1.2 }, gentle: { w: 248, h: 588, scale: 1.55 }, curious: { w: 320, h: 501, scale: 1.76 },
    happy: { w: 304, h: 408, scale: 1.6 }, thinking: { w: 281, h: 437, scale: 1.45 },
  },
  mother: { neutral: { w: 388, h: 728, scale: 1.2 }, gentle: { w: 243, h: 547, scale: 1.56 }, happy: { w: 306, h: 527, scale: 1.56 } },
  teacher: { neutral: { w: 368, h: 689, scale: 1.23 }, gentle: { w: 275, h: 498, scale: 1.36 }, happy: { w: 292, h: 459, scale: 1.36 } },
}

export function bustImage(id: CharacterId, emotion: Emotion = 'neutral') {
  const set = BUSTS[id]
  const e: Emotion = set[emotion] ? emotion : emotion === 'tired' && set.gentle ? 'gentle' : 'neutral'
  const b = set[e]!
  // ให้ขอบล่างของภาพอยู่ใต้กล่องบทสนทนาเสมอ (กล่องเริ่มที่ y≈818) ภาพจะได้ไม่ลอย
  const height = b.h * b.scale
  const top = Math.round(Math.max(150, 900 - height))
  return { src: `${base}/${id}/bust-${e}.png`, width: Math.round(b.w * b.scale), top, key: `${id}-${e}` }
}
