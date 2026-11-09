// ภาพประกอบตัวเลือกของภารกิจ M01–M08 แยกตามตัวเอกที่ผู้เล่นเลือก
//   หญิง (มะลิ): public/assets/choices/M01/M01_A.webp
//   ชาย  (ไค):   public/assets/choices/M01/M01_A_male.webp
// ต้นฉบับอยู่ที่ m01/ก หญิง, m01/ก ชาย … ในโฟลเดอร์โปรเจกต์
// ภาพใช้แสดงผลเท่านั้น — การตรวจคำตอบใช้ isCorrect ใน story.json เสมอ
import type { CharacterType, HeroDef } from './hero'

const SUFFIX: Record<CharacterType, string> = { female: '', male: '_male' }

/** ที่อยู่ภาพตาม Mission ID + Choice ID + ตัวเอก เช่น ('M01', 'A', male) → /assets/choices/M01/M01_A_male.webp */
export function choiceArt(missionId: string, choiceId: string, hero: HeroDef): string {
  return `/assets/choices/${missionId}/${missionId}_${choiceId}${SUFFIX[hero.characterType]}.webp`
}

/** สำหรับหน้าความทรงจำ: แปลงที่อยู่เดิมใน story.json (/assets/choices/m01_a.jpg) → ภาพชุดใหม่ */
export function choiceArtFromPath(src: string, hero: HeroDef): string | null {
  const m = /m(\d{2})_([ab])\.\w+$/i.exec(src)
  return m ? choiceArt(`M${m[1]}`, m[2].toUpperCase(), hero) : null
}
