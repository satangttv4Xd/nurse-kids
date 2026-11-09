// โครงสร้างข้อมูลเนื้อเรื่อง/ภารกิจ (ใช้กับ src/shared/story.json)
import type { CharacterId } from './scenes'

export type Emotion = 'neutral' | 'happy' | 'curious' | 'gentle' | 'tired' | 'thinking'

export interface Line {
  speaker: CharacterId | 'narrator'
  text: string
  emotion?: Emotion
  /** แสดงในฉากนี้แทนฉากของกลุ่มบท (ไม่ระบุ = ใช้ฉากของกลุ่ม) */
  sceneId?: string
  /** ไฟล์เสียงพากย์ (วางแผนไว้ ยังไม่มีไฟล์) */
  voice?: string
}

/** ทุกภารกิจมี 2 ตัวเลือกเท่านั้น: A (การ์ดซ้าย) และ B (การ์ดขวา) */
export interface Choice {
  id: 'A' | 'B'
  /** ข้อความใต้ภาพบนการ์ด (ภาษาสำหรับเด็ก) */
  text: string
  /** ข้อความตามเอกสารต้นฉบับ */
  sourceText: string
  /** รูปตัวเลือก (ชื่อไฟล์ที่วางแผนไว้ — ยังไม่มีไฟล์จริง) */
  image: string
  isCorrect: boolean
  feedback: string
}

/** สิ่งของให้แตะสำรวจก่อนเข้าภารกิจ (ไม่บังคับ ไม่นับคะแนน ไม่บันทึกข้อมูล) */
export interface ExploreItem {
  icon: string
  label: string
  /** ปุยพูดเมื่อแตะ */
  text: string
}

export interface Mission {
  missionId: string
  area: string
  sceneId: string
  title: string
  objective: string
  /** สถานการณ์ตามเอกสารต้นฉบับ (เปลี่ยน "น้องมดแดง" เป็น "มะลิ") */
  scenario: string
  explore: ExploreItem[]
  intro: Line[]
  question: Line
  /** คำถามแบบง่าย สำหรับ Guided Mode */
  questionSimple: string
  choices: [Choice, Choice]
  /** ผู้ใหญ่ในเกมพูดเสริมหลังตอบถูก */
  correctLines: Line[]
  /** คำอธิบายความรู้หลังตอบ (ภาษาสำหรับเด็ก — ปุยเป็นคนพูด) */
  explanation: string
  /** คำอธิบายตามเอกสารต้นฉบับ */
  explanationSource: string
  hints: string[]
  outro: Line[]
  nextMission: string | null
  clinicalReview: boolean
  clinicalNote?: string
}

export interface StoryBeat {
  id: string
  sceneId: string
  lines: Line[]
}

export interface Area {
  id: string
  name: string
  nameEn: string
  goal: string
  /** ตราผู้พิทักษ์ที่ได้เมื่อจบดินแดน */
  badge: { icon: string; name: string }
  intro: StoryBeat
  missions: string[]
  ending: StoryBeat
  /** ฉากเปลี่ยนไปดินแดนถัดไป (ดินแดนสุดท้าย = null) */
  transition: StoryBeat | null
}

export interface Story {
  version: string
  title: string
  disclaimer: string
  opening: StoryBeat[]
  areas: Area[]
  missions: Mission[]
  ending: {
    beats: StoryBeat[]
    memories: { areaId: string; title: string; summary: string; images: string[] }[]
    finalMessage: string
  }
}
