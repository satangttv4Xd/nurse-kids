// ข้อมูลผู้เล่น + ระบบบันทึกการเล่น
// ส่งข้อมูลไปที่ Research API (/api) ผ่านคิวออฟไลน์ — ถ้าเน็ตหลุด ข้อมูลรอในเครื่องแล้วส่งใหม่อัตโนมัติ
//
// ⚠️ การเก็บข้อมูลวิจัยกับเด็กจริงต้องได้รับการอนุมัติจริยธรรม ความยินยอมผู้ปกครอง และความยินยอมของเด็กก่อน
//    ปิดการรับข้อมูลที่เซิร์ฟเวอร์ได้ด้วย COLLECTION_ENABLED=false

export const NICKNAME_MAX = 20
const GAME_VERSION = '0.2.0'

const graphemes = (s: string): string[] => {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter
  return Seg ? Array.from(new Seg('th', { granularity: 'grapheme' }).segment(s), x => x.segment) : Array.from(s)
}

/** อนุญาตเฉพาะอักษรไทย อังกฤษ ตัวเลข และช่องว่าง — ตัด < > " ' & / และสัญลักษณ์อื่นทิ้ง (กัน HTML/Script injection)
 *  และจำกัดไม่เกิน 20 ตัวอักษร (นับแบบที่ตาเห็น เช่น "น้อง" = 3 ตัว ไม่นับวรรณยุกต์แยก) */
export function sanitizeNickname(raw: string): string {
  const cleaned = raw.replace(/[^฀-๿A-Za-z0-9 ]/g, '').replace(/\s{2,}/g, ' ').replace(/^\s+/, '')
  return graphemes(cleaned).slice(0, NICKNAME_MAX).join('')
}

export const nicknameLength = (s: string) => graphemes(s).length

export interface PlayerSession {
  /** รหัสสุ่ม ไม่เกี่ยวกับชื่อเล่นหรือข้อมูลส่วนตัว */
  participantId: string
  sessionId: string
  /** ใช้แสดงในเกม */
  nickname: string
  startedAt: string
}

const randomHex = (bytes: number) => {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('')
}
const uuid = () => crypto.randomUUID?.() ?? `${randomHex(4)}-${randomHex(2)}-4${randomHex(2).slice(1)}-a${randomHex(2).slice(1)}-${randomHex(6)}`

export function createSession(nickname: string): PlayerSession {
  return {
    participantId: `P-${randomHex(4).toUpperCase()}`,
    sessionId: uuid(),
    nickname: sanitizeNickname(nickname).trim(),
    startedAt: new Date().toISOString(),
  }
}

// ---------- เหตุการณ์ในเกม (ตรงกับ server/validators.ts) ----------

export type PlayEvent =
  | { type: 'mission_start'; missionId: string }
  | { type: 'answer'; missionId: string; choiceId: 'A' | 'B'; isCorrect: boolean; attempt: number; responseMs: number; hintsUsed: number; caregiverAssisted: boolean }
  | { type: 'hint'; missionId: string; level: number }
  | { type: 'assist'; missionId: string }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'exit'; stepIndex: number }
  | { type: 'step_view'; stepIndex: number }

// ---------- คิวออฟไลน์ ----------

interface Op { path: string; body: unknown }
const OUTBOX_KEY = 'littlesteps.outbox'
let outbox: Op[] = []
let pending: (PlayEvent & { eventId: string; at: string })[] = []
let current: PlayerSession | null = null
let flushing = false
let timer: ReturnType<typeof setTimeout> | undefined

try { outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? '[]') } catch { outbox = [] }
const save = () => { try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox.slice(-500))) } catch { /* ไม่มี storage */ } }

function enqueue(op: Op) {
  outbox.push(op)
  save()
  void flush()
}

function movePending() {
  if (!pending.length || !current) return
  for (let i = 0; i < pending.length; i += 200) enqueue({ path: '/api/events', body: { sessionId: current.sessionId, events: pending.slice(i, i + 200) } })
  pending = []
}

async function flush() {
  if (flushing || !outbox.length) return
  flushing = true
  try {
    while (outbox.length) {
      const op = outbox[0]
      let res: Response
      try {
        res = await fetch(op.path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op.body), keepalive: true })
      } catch {
        break // ออฟไลน์ — ลองใหม่ภายหลัง
      }
      if (res.status >= 500 && res.status !== 503) break // เซิร์ฟเวอร์มีปัญหาชั่วคราว
      // 2xx = สำเร็จ · 4xx = ข้อมูลไม่ถูกต้อง (ทิ้ง ไม่ให้คิวค้าง) · 503 = ปิดการเก็บข้อมูล (ทิ้ง)
      outbox.shift()
      save()
    }
  } finally {
    flushing = false
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flush())
  setInterval(() => void flush(), 15_000)
  // ปิดแท็บ/ย้ายไปแอปอื่น — ส่งที่ค้างทันที
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { movePending(); void flush() } })
}

function deviceType(): 'desktop' | 'tablet' | 'phone' {
  const touch = matchMedia('(pointer: coarse)').matches
  if (!touch) return 'desktop'
  return Math.min(screen.width, screen.height) >= 600 ? 'tablet' : 'phone'
}

export function startTracking(s: PlayerSession, settings: { musicOn: boolean; voiceOn: boolean }) {
  current = s
  enqueue({ path: '/api/participants', body: { participantId: s.participantId, nickname: s.nickname || undefined } })
  enqueue({
    path: '/api/sessions',
    body: { sessionId: s.sessionId, participantId: s.participantId, startedAt: s.startedAt,
      settings: { assistanceMode: 'independent', musicOn: settings.musicOn, voiceOn: settings.voiceOn, deviceType: deviceType(), gameVersion: GAME_VERSION } },
  })
}

export function track(e: PlayEvent) {
  if (!current) return
  pending.push({ ...e, eventId: uuid(), at: new Date().toISOString() })
  clearTimeout(timer)
  // คำตอบ/พัก/ออก ส่งทันที ส่วนอื่นรวมส่งทุก 3 วินาที
  if (e.type === 'answer' || e.type === 'pause' || e.type === 'exit') movePending()
  else timer = setTimeout(movePending, 3000)
}

export function endSession(status: 'completed' | 'interrupted') {
  if (!current) return
  movePending()
  enqueue({ path: `/api/sessions/${current.sessionId}/complete`, body: { endedAt: new Date().toISOString(), status } })
  current = null
}

/** แทน {nickname} ในบทพูดด้วยชื่อเล่นผู้เล่น (React แสดงเป็นข้อความธรรมดา ไม่ตีความ HTML) */
export const withNickname = (text: string, nickname: string) => text.replaceAll('{nickname}', nickname || 'เพื่อน')
