// ตรวจข้อมูลทุกอย่างก่อนบันทึก (zod) — ข้อมูลที่ไม่ตรงรูปแบบถูกปฏิเสธทั้งหมด
import { z } from 'zod'

export const participantId = z.string().regex(/^P-[0-9A-F]{8}$/)
const isoDate = z.string().datetime({ offset: true })
// ชื่อเล่น: อักษรไทย/อังกฤษ/ตัวเลข/ช่องว่างเท่านั้น
export const nickname = z.string().trim().max(40).regex(/^[฀-๿A-Za-z0-9 ]*$/)
const missionId = z.string().regex(/^M0[1-8]$/)

export const createParticipant = z.object({
  participantId: participantId.optional(),
  nickname: nickname.optional(),
})

export const createSession = z.object({
  sessionId: z.string().uuid(),
  participantId,
  startedAt: isoDate,
  settings: z.object({
    assistanceMode: z.enum(['independent', 'guided', 'supported']).default('independent'),
    musicOn: z.boolean().default(true),
    voiceOn: z.boolean().default(true),
    deviceType: z.enum(['desktop', 'tablet', 'phone', 'unknown']).default('unknown'),
    gameVersion: z.string().max(20).optional(),
  }).optional(),
})

const baseEvent = { eventId: z.string().uuid(), at: isoDate }

export const gameEvent = z.discriminatedUnion('type', [
  z.object({ ...baseEvent, type: z.literal('mission_start'), missionId }),
  z.object({
    ...baseEvent, type: z.literal('answer'), missionId,
    choiceId: z.enum(['A', 'B']), isCorrect: z.boolean(),
    attempt: z.number().int().min(1).max(100),
    responseMs: z.number().int().min(0).max(86_400_000),
    hintsUsed: z.number().int().min(0).max(10),
    caregiverAssisted: z.boolean().default(false),
  }),
  z.object({ ...baseEvent, type: z.literal('hint'), missionId, level: z.number().int().min(1).max(10) }),
  z.object({ ...baseEvent, type: z.literal('assist'), missionId }),
  z.object({ ...baseEvent, type: z.literal('pause') }),
  z.object({ ...baseEvent, type: z.literal('resume') }),
  z.object({ ...baseEvent, type: z.literal('exit'), stepIndex: z.number().int().min(0).max(10_000) }),
  z.object({ ...baseEvent, type: z.literal('step_view'), stepIndex: z.number().int().min(0).max(10_000) }),
  z.object({ ...baseEvent, type: z.literal('mission_skip'), missionId }),
])
export type GameEvent = z.infer<typeof gameEvent>

export const eventBatch = z.object({
  sessionId: z.string().uuid(),
  events: z.array(gameEvent).min(1).max(200),
})

export const completeSession = z.object({
  endedAt: isoDate,
  status: z.enum(['completed', 'interrupted']),
})

export const listFilter = z.object({
  q: z.string().max(20).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  demo: z.enum(['exclude', 'include', 'only']).default('exclude'),
})
export type ListFilter = z.infer<typeof listFilter>

export const exportQuery = listFilter.extend({
  dataset: z.enum(['participants', 'sessions', 'missions', 'all']).default('all'),
  format: z.enum(['csv', 'xlsx']).default('csv'),
})

export const consentBody = z.object({
  guardianConsent: z.boolean(),
  childAssent: z.boolean(),
  formReference: z.string().trim().max(80).optional(),
  note: z.string().trim().max(500).optional(),
  withdrawn: z.boolean().default(false),
})

export const loginBody = z.object({
  username: z.string().min(1).max(40),
  password: z.string().min(1).max(200),
})

export const userBody = z.object({
  username: z.string().regex(/^[a-zA-Z0-9._-]{3,40}$/),
  password: z.string().min(10).max(200),
  role: z.enum(['admin', 'researcher', 'viewer']),
})

export const userPatch = z.object({
  role: z.enum(['admin', 'researcher', 'viewer']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(10).max(200).optional(),
})
