// ตัวเอกที่ผู้เล่นเลือก (หญิง = มะลิ / ชาย = ไค)
// เนื้อเรื่องใน story.json เขียนด้วยตัวละคร 'mali' — ตอนแสดงผลจะสลับรูป/ชื่อ/คำลงท้ายตามตัวเอกที่เลือก
// (ไม่แก้ story.json · โจทย์ ตัวเลือก และเฉลยเหมือนเดิมทุกข้อ เปลี่ยนแค่ชื่อตัวเอก)
import type { CharacterId } from './scenes'

export type CharacterType = 'female' | 'male'
export type HeroId = 'mali' | 'kai'

export interface HeroDef {
  characterType: CharacterType
  characterId: HeroId
  name: string
  title: string
  desc: string
}

export const HEROES: Record<CharacterType, HeroDef> = {
  male: { characterType: 'male', characterId: 'kai', name: 'ไค', title: 'MALE GUARDIAN',
    desc: 'นักผจญภัยใจกล้า พร้อมเป้คู่ใจ ชอบสำรวจทุกเส้นทาง' },
  female: { characterType: 'female', characterId: 'mali', name: 'มะลิ', title: 'FEMALE GUARDIAN',
    desc: 'ผู้พิทักษ์ช่างสังเกต ร่าเริง และไม่ยอมแพ้ง่าย ๆ' },
}

export const DEFAULT_HERO = HEROES.female

/** ตัวละคร 'mali' ในเนื้อเรื่อง → ตัวเอกที่เลือก (ตัวละครอื่นคงเดิม) */
export const heroCharId = (id: CharacterId, hero: HeroDef): CharacterId => (id === 'mali' ? hero.characterId : id)

/** ปรับข้อความให้ตรงกับผู้เล่น: ชื่อเล่น + ชื่อตัวเอก + คำลงท้ายของตัวเอก (ชาย: คะ/ค่ะ → ครับ) */
export function personalize(text: string, nickname: string, hero: HeroDef, speaker?: string): string {
  let t = text.replaceAll('{nickname}', nickname || 'เพื่อน')
  if (hero.characterId !== 'mali') {
    t = t.replaceAll('มะลิ', hero.name)
    if (speaker === 'mali') t = t.replace(/ค่ะ|คะ/g, 'ครับ')
  }
  return t
}
