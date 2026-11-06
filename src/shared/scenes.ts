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
  { id: 's01', location: 'หมู่บ้านแห่งเวลา', title: 'บ้านพักในหมู่บ้าน', bg: bg(1), missions: ['M01'], characters: ['mali', 'pui', 'mother'] },
  { id: 's02', location: 'ดินแดนแสงจันทร์', title: 'ห้องนอนยามค่ำ', bg: bg(2), missions: ['M03'], characters: ['mali', 'pui'] },
  { id: 's03', location: 'หมู่บ้านแห่งเวลา', title: 'มุมยาของหมู่บ้าน', bg: bg(3), missions: ['M02'], characters: ['mali', 'pui', 'mother'] },
  { id: 's04', location: 'ดินแดนแสงตะวัน', title: 'ทางเข้าดินแดน', bg: bg(4), missions: [], characters: ['mali', 'pui'] },
  { id: 's05', location: 'ดินแดนแสงตะวัน', title: 'มุมพักผ่อน', bg: bg(5), missions: [], characters: ['mali', 'pui'] },
  { id: 's06', location: 'ดินแดนแสงตะวัน', title: 'สนามยามเที่ยง', bg: bg(6), missions: ['M04'], characters: ['mali', 'pui', 'teacher'] },
  { id: 's07', location: 'วิหารคริสตัล', title: 'ห้องเรียนในวิหาร', bg: bg(7), missions: ['M05'], characters: ['mali', 'pui', 'teacher'] },
  { id: 's08', location: 'วิหารคริสตัล', title: 'พื้นที่ปลอดภัย', bg: bg(8), missions: ['M06'], characters: ['mali', 'pui', 'teacher'] },
  { id: 's09', location: 'หมู่บ้านแห่งเวลา', title: 'ลานหอนาฬิกา', bg: bg(9), missions: [], characters: ['mali', 'pui'] },
  { id: 's10', location: 'ประภาคารแห่งความหวัง', title: 'ทางเดินสู่ประภาคาร', bg: bg(10), missions: ['M07'], characters: ['mali', 'pui', 'teacher'] },
  { id: 's11', location: 'ประภาคารแห่งความหวัง', title: 'โต๊ะสมุดบันทึก', bg: bg(11), missions: ['M08'], characters: ['mali', 'pui', 'mother'] },
  { id: 's12', location: 'ฉากจบ', title: 'กลับบ้าน', bg: bg(12), missions: [], characters: ['mali', 'pui', 'mother'] },
]
