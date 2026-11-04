// รายการฉากทั้งหมด — ภาพพื้นหลังจริงอยู่ที่ public/assets/bg/
// ตัวละคร (sprite พื้นใส) ยังไม่มี → แสดงเป็นกรอบ placeholder
export type CharacterId = 'mali' | 'pui' | 'mother' | 'teacher'

export interface SceneDef {
  id: string
  location: string
  title: string
  bg: string | null
  missions: string[]
  characters: CharacterId[]
}

export const CHARACTER_NAMES: Record<CharacterId, string> = {
  mali: 'มะลิ',
  pui: 'ปุยนุ่ม',
  mother: 'คุณแม่',
  teacher: 'คุณครู',
}

const bg = (n: number) => `/assets/bg/scene${String(n).padStart(2, '0')}.jpg`

export const SCENES: SceneDef[] = [
  { id: 's01', location: 'บ้านแสนอบอุ่น', title: 'ห้องนั่งเล่น', bg: bg(1), missions: ['M01'], characters: ['mali', 'pui', 'mother'] },
  { id: 's02', location: 'บ้านแสนอบอุ่น', title: 'ห้องนอน', bg: bg(2), missions: ['M03'], characters: ['mali', 'pui'] },
  { id: 's03', location: 'บ้านแสนอบอุ่น', title: 'มุมเตรียมยา', bg: bg(3), missions: ['M02'], characters: ['mali', 'pui', 'mother'] },
  { id: 's04', location: 'สวนแห่งการพักผ่อน', title: 'ทางเข้าสวน', bg: bg(4), missions: [], characters: ['mali', 'pui'] },
  { id: 's05', location: 'สวนแห่งการพักผ่อน', title: 'มุมพักผ่อน', bg: bg(5), missions: [], characters: ['mali', 'pui'] },
  { id: 's06', location: 'สวนแห่งการพักผ่อน', title: 'สวนในวันอากาศร้อน', bg: bg(6), missions: ['M04'], characters: ['mali', 'pui', 'teacher'] },
  { id: 's07', location: 'โรงเรียนสายรุ้ง', title: 'ห้องเรียน', bg: bg(7), missions: ['M05'], characters: ['mali', 'pui', 'teacher'] },
  { id: 's08', location: 'โรงเรียนสายรุ้ง', title: 'พื้นที่ปลอดภัย', bg: bg(8), missions: ['M06'], characters: ['mali', 'pui', 'teacher'] },
  { id: 's09', location: 'หมู่บ้านแห่งมิตรภาพ', title: 'ทางเข้าหมู่บ้าน', bg: bg(9), missions: [], characters: ['mali', 'pui'] },
  { id: 's10', location: 'หมู่บ้านแห่งมิตรภาพ', title: 'ศูนย์ชุมชน', bg: bg(10), missions: ['M07'], characters: ['mali', 'pui', 'teacher'] },
  { id: 's11', location: 'หมู่บ้านแห่งมิตรภาพ', title: 'โต๊ะบันทึกความทรงจำ', bg: bg(11), missions: ['M08'], characters: ['mali', 'pui', 'mother'] },
  { id: 's12', location: 'ฉากจบ', title: 'กลับบ้าน', bg: bg(12), missions: [], characters: ['mali', 'pui', 'mother'] },
]
