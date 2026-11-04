// เรียก REST API ของ Dashboard (cookie httpOnly ถูกส่งไปอัตโนมัติ)
export type Role = 'admin' | 'researcher' | 'viewer'
export interface User { id: number; username: string; role: Role }

export interface Filter { q?: string; from?: string; to?: string; demo: 'exclude' | 'include' | 'only' }

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

const qs = (f: object = {}) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`/api${path}`, {
    method, credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, data.error ?? `เกิดข้อผิดพลาด (${r.status})`)
  return data as T
}

export const api = {
  me: () => req<{ user: User }>('GET', '/auth/me'),
  login: (username: string, password: string) => req<{ user: User }>('POST', '/auth/login', { username, password }),
  logout: () => req('POST', '/auth/logout'),
  overview: (f: Filter) => req<Overview>('GET', `/dashboard/overview${qs(f)}`),
  analytics: (f: Filter) => req<Analytics>('GET', `/dashboard/analytics${qs(f)}`),
  participants: (f: Filter) => req<ParticipantRow[]>('GET', `/dashboard/participants${qs(f)}`),
  participant: (id: string) => req<ParticipantDetail>('GET', `/dashboard/participants/${encodeURIComponent(id)}`),
  sessions: (f: Filter) => req<SessionRow[]>('GET', `/dashboard/sessions${qs(f)}`),
  recordConsent: (id: string, b: { guardianConsent: boolean; childAssent: boolean; formReference?: string; note?: string; withdrawn?: boolean }) =>
    req('POST', `/dashboard/participants/${encodeURIComponent(id)}/consent`, b),
  exportUrl: (f: Filter & { dataset: string; format: string }) => `/api/dashboard/export${qs(f)}`,
  users: () => req<AdminUser[]>('GET', '/admin/users'),
  createUser: (b: { username: string; password: string; role: Role }) => req('POST', '/admin/users', b),
  updateUser: (id: number, b: { role?: Role; isActive?: boolean; password?: string }) => req('PATCH', `/admin/users/${id}`, b),
  deleteParticipant: (id: string) => req('DELETE', `/admin/participants/${encodeURIComponent(id)}`),
  retention: () => req<{ retentionDays: number; expiredParticipants: number }>('GET', '/admin/retention'),
  purge: () => req<{ deleted: number }>('POST', '/admin/retention/purge'),
  clearDemo: () => req<{ deleted: number }>('POST', '/admin/demo/clear'),
  seedDemo: () => req<{ participants: number; sessions: number }>('POST', '/admin/demo/seed'),
  auditLogs: () => req<AuditRow[]>('GET', '/admin/audit-logs'),
}

export interface Overview {
  participants: number; participantsRegistered: number; sessions: number; completed: number; notCompleted: number
  missionsCompleted: number; firstAttemptCorrectRate: number | null; hasDemoData: boolean
}
export interface MissionStat {
  id: string; area: string; title: string; started: number; completed: number; answers: number
  firstCorrect: number; firstAttemptCorrectRate: number | null; completionRate: number | null; choiceA: number; choiceB: number
  hints: number; skipped: number; avgSecondsToCorrect: number | null
}
export interface Analytics {
  overallMissionCompletionRate: number | null
  missions: MissionStat[]
  sessionDurations: { sessionId: string; participantId: string; startedAt: string; durationSec: number; status: string }[]
  statusCounts: Record<string, number>
  assistance: { kind: 'independent' | 'after_hint' | 'caregiver'; total: number; correct: number; correctRate: number | null }[]
}
export interface ParticipantRow {
  participant_id: string; nickname: string | null; created_at: string; is_demo: boolean; session_count: number
  last_played_at: string | null; ever_completed: boolean | null
  consent_status: 'none' | 'partial' | 'consented' | 'withdrawn'
}
export interface SessionRow {
  session_id: string; participant_id: string; started_at: string; ended_at: string | null; status: string
  duration_sec: number; pause_count: number; resume_count: number; is_demo: boolean; assistance_mode: string | null
  device_type: string | null; missions_completed: number; missions_skipped: number; hints: number; assists: number
}
export interface TimelineEvent {
  session_id: string; event_type: string; mission_id: string | null; choice_id?: string | null; is_correct?: boolean | null
  attempt?: number | null; hint_level?: number | null; response_ms?: number | null; caregiver_assisted?: boolean; step_index?: number | null; occurred_at: string
}
export interface ParticipantDetail {
  participant: ParticipantRow
  sessions: { session_id: string; started_at: string; ended_at: string | null; status: string; pause_count: number; resume_count: number; duration_sec: number }[]
  missions: { id: string; title: string; area: string; completed: boolean; hints: number; assists: number
    answers: { choiceId: string; isCorrect: boolean; attempt: number; responseMs: number; at: string; sessionId: string }[] }[]
  timeline: TimelineEvent[]
  consent: { guardian_consent: boolean; child_assent: boolean; form_reference: string | null; note: string | null; recorded_at: string; withdrawn_at: string | null }[]
}
export interface AdminUser { id: number; username: string; role: Role; is_active: boolean; created_at: string; last_login_at: string | null }
export interface AuditRow { id: number; username: string | null; action: string; target: string | null; detail: unknown; ip: string | null; created_at: string }
