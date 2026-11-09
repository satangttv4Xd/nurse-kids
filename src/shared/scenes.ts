// รายการฉากทั้งหมด — ภาพพื้นหลังจริงอยู่ที่ public/assets/bg/
// ตัวละคร (sprite พื้นใส) ยังไม่มี → แสดงเป็นกรอบ placeholder
export type CharacterId = 'mali' | 'kai' | 'pui' | 'mother' | 'teacher'

export interface SceneDef {
  id: string
  location: string
  title: string
  bg: string | null
  missions: string[]
  characters: CharacterId[]
  /** โทนกลางคืน (หรี่ภาพแบบคงที่ ไม่มีการเปลี่ยนความสว่างฉับพลัน) */
  night?: boolean
}

export const CHARACTER_NAMES: Record<CharacterId, string> = {
  mali: 'มะลิ',
  kai: 'ไค',
  pui: 'ปุยนุ่ม',
  mother: 'คุณแม่',
  teacher: 'คุณครู',
}

// ฉากชุด The Guardian's Journey (ย่อจากโฟลเดอร์ ฉากใหม่/ — เลขตามชื่อไฟล์ต้นฉบับ ไม่มี Scene 11)
const bg = (n: number) => `/assets/bg2/scene${String(n).padStart(2, '0')}.jpg`

export const SCENES: SceneDef[] = [
  { id: 'g01', location: 'โลกแห่งผู้พิทักษ์', title: 'หุบเขายามเช้า', bg: bg(1), missions: [], characters: ['mali', 'pui'] },
  { id: 'g02', location: 'บ้านของมะลิ', title: 'ห้องลับใต้หลังคา', bg: bg(2), missions: [], characters: ['mali', 'pui', 'mother'] },
  { id: 'g03', location: 'บ้านของมะลิ', title: 'แผนที่ตื่นแล้ว', bg: bg(3), missions: [], characters: [] },
  { id: 'g04', location: 'หมู่บ้านผู้พิทักษ์', title: 'ประตูหมู่บ้าน', bg: bg(4), missions: [], characters: ['mali', 'pui'] },
  { id: 'g05', location: 'หมู่บ้านผู้พิทักษ์', title: 'ห้องยาวิเศษ', bg: bg(5), missions: ['M01', 'M02'], characters: ['mali', 'pui', 'mother'] },
  { id: 'g06', location: 'หมู่บ้านผู้พิทักษ์', title: 'สวนกลางหมู่บ้าน', bg: bg(6), missions: [], characters: ['mali', 'pui', 'mother'] },
  { id: 'g07', location: 'ดินแดนแสงตะวัน', title: 'ทุ่งกว้างสุดสายตา', bg: bg(7), missions: [], characters: ['mali', 'pui'] },
  { id: 'g08', location: 'ดินแดนแสงตะวัน', title: 'ลานแคมป์กลางป่า', bg: bg(8), missions: [], characters: ['mali', 'pui'] },
  { id: 'g08n', location: 'ดินแดนแสงตะวัน', title: 'ลานแคมป์ยามค่ำ', bg: bg(8), missions: ['M03'], characters: ['mali', 'pui'], night: true },
  { id: 'g09', location: 'ดินแดนแสงตะวัน', title: 'ทุ่งแดดจ้า', bg: bg(9), missions: ['M04'], characters: ['mali', 'pui', 'teacher'] },
  { id: 'g10', location: 'ดินแดนแสงตะวัน', title: 'ศาลาร่มเย็น', bg: bg(10), missions: [], characters: ['mali', 'pui', 'teacher'] },
  { id: 'g12', location: 'วิหารคริสตัล', title: 'ป่าคริสตัล', bg: bg(12), missions: ['M05'], characters: ['mali', 'pui', 'teacher'] },
  { id: 'g13', location: 'วิหารคริสตัล', title: 'ห้องพักปลอดภัย', bg: bg(13), missions: ['M06'], characters: ['mali', 'pui', 'mother'] },
  { id: 'g14', location: 'วิหารคริสตัล', title: 'โถงวิหาร', bg: bg(14), missions: [], characters: ['mali', 'pui', 'teacher'] },
  { id: 'g15', location: 'ประภาคารแห่งความหวัง', title: 'เนินประภาคาร', bg: bg(15), missions: [], characters: ['mali', 'pui'] },
  { id: 'g16', location: 'ประภาคารแห่งความหวัง', title: 'สถานีส่งสัญญาณ', bg: bg(16), missions: ['M07'], characters: ['mali', 'pui', 'teacher'] },
  { id: 'g17', location: 'ประภาคารแห่งความหวัง', title: 'ห้องสมุดบันทึกฮีโร่', bg: bg(17), missions: ['M08'], characters: ['mali', 'pui', 'mother'] },
  { id: 'g18', location: 'ประภาคารแห่งความหวัง', title: 'โถงไฟทองคำ', bg: bg(18), missions: [], characters: ['mali', 'pui'] },
  { id: 'g19', location: 'กลับบ้าน', title: 'คำสัญญาของผู้พิทักษ์', bg: bg(19), missions: [], characters: ['mali', 'pui', 'mother', 'teacher'] },
]
