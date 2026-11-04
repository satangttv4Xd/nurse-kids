// คำนวณสถิติสำหรับ Dashboard จากข้อมูลจริงในฐานข้อมูล
// หมายเหตุ: ผลการเล่นเป็นข้อมูลพฤติกรรมการเรียนรู้ ห้ามใช้วินิจฉัยหรือประเมินความสามารถทางการแพทย์
import { config } from '../config.ts'
import { q } from '../db.ts'
import type { ListFilter } from '../validators.ts'

export const MISSIONS = [
  { id: 'M01', area: 'Medication Hero', title: 'ภารกิจเวลาเป๊ะ' },
  { id: 'M02', area: 'Medication Hero', title: 'ภารกิจไม่แอบหยุดยา' },
  { id: 'M03', area: 'Shield Against Triggers', title: 'ภารกิจปิดจอผ่อนใจ' },
  { id: 'M04', area: 'Shield Against Triggers', title: 'ภารกิจสู้แดดและตัวร้อน' },
  { id: 'M05', area: 'Aura & Rescue Master', title: 'ภารกิจสังเกตสัญญาณเตือน' },
  { id: 'M06', area: 'Aura & Rescue Master', title: 'ภารกิจเซฟตัวเองลงเบาะนุ่ม' },
  { id: 'M07', area: 'SOS & Super Seeker', title: 'ภารกิจตะโกนส่งสัญญาณ SOS' },
  { id: 'M08', area: 'SOS & Super Seeker', title: 'ภารกิจสมุดบันทึกฮีโร่' },
]

/** สถานะ session รวม abandoned (ไม่มีความเคลื่อนไหวเกินเวลาที่กำหนด) */
export const statusSql = (a = 's') => `CASE
  WHEN ${a}.status IN ('completed','interrupted') THEN ${a}.status
  WHEN now() - COALESCE(${a}.last_event_at, ${a}.started_at) > interval '${Math.max(1, Math.floor(config.abandonAfterMinutes))} minutes' THEN 'abandoned'
  ELSE ${a}.status END`

/** สร้างเงื่อนไข WHERE สำหรับ sessions (alias s) + participants (alias p) */
export function filterSql(f: ListFilter, params: unknown[] = []) {
  const w: string[] = []
  if (f.demo === 'exclude') w.push('p.is_demo = FALSE')
  if (f.demo === 'only') w.push('p.is_demo = TRUE')
  if (f.q) { params.push(`%${f.q.toUpperCase()}%`); w.push(`p.participant_id LIKE $${params.length}`) }
  if (f.from) { params.push(f.from); w.push(`s.started_at >= $${params.length}::date`) }
  if (f.to) { params.push(f.to); w.push(`s.started_at < ($${params.length}::date + 1)`) }
  return { where: w.length ? `WHERE ${w.join(' AND ')}` : '', params }
}

const n = (v: unknown) => Number(v ?? 0)
const rate = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null)

export async function overview(f: ListFilter) {
  const { where, params } = filterSql(f)
  const [s] = await q(`
    SELECT count(DISTINCT p.participant_id) AS participants,
           count(DISTINCT s.session_id) AS sessions,
           count(DISTINCT s.session_id) FILTER (WHERE s.status = 'completed') AS completed
    FROM sessions s JOIN participants p USING (participant_id) ${where}`, params)
  const { where: w2, params: p2 } = filterSql(f)
  const [m] = await q(`
    SELECT count(DISTINCT (e.session_id, e.mission_id)) FILTER (WHERE e.is_correct) AS missions_completed,
           count(*) FILTER (WHERE e.attempt = 1) AS first_attempts,
           count(*) FILTER (WHERE e.attempt = 1 AND e.is_correct) AS first_correct
    FROM mission_events e JOIN sessions s USING (session_id) JOIN participants p USING (participant_id)
    ${w2 ? w2 + ' AND' : 'WHERE'} e.event_type = 'answer'`, p2)
  const demoWhere = f.demo === 'exclude' ? 'WHERE NOT is_demo' : f.demo === 'only' ? 'WHERE is_demo' : ''
  const [allP] = await q(`SELECT count(*) AS n FROM participants ${demoWhere}`)
  const sessions = n(s.sessions), completed = n(s.completed)
  const [demo] = await q('SELECT count(*) AS n FROM participants WHERE is_demo')
  return {
    participants: n(s.participants),
    participantsRegistered: n(allP?.n),
    sessions, completed, notCompleted: sessions - completed,
    missionsCompleted: n(m.missions_completed),
    firstAttemptCorrectRate: rate(n(m.first_correct), n(m.first_attempts)),
    hasDemoData: n(demo.n) > 0,
  }
}

export async function participants(f: ListFilter) {
  const params: unknown[] = []
  const w: string[] = []
  if (f.demo === 'exclude') w.push('p.is_demo = FALSE')
  if (f.demo === 'only') w.push('p.is_demo = TRUE')
  if (f.q) { params.push(`%${f.q.toUpperCase()}%`); w.push(`p.participant_id LIKE $${params.length}`) }
  if (f.from) { params.push(f.from); w.push(`p.created_at >= $${params.length}::date`) }
  if (f.to) { params.push(f.to); w.push(`p.created_at < ($${params.length}::date + 1)`) }
  return q(`
    SELECT p.participant_id, p.nickname, p.created_at, p.is_demo,
           count(s.session_id)::int AS session_count,
           max(s.started_at) AS last_played_at,
           bool_or(s.status = 'completed') AS ever_completed,
           c.guardian_consent, c.child_assent, c.withdrawn_at, c.recorded_at AS consent_recorded_at,
           CASE WHEN c.id IS NULL THEN 'none'
                WHEN c.withdrawn_at IS NOT NULL THEN 'withdrawn'
                WHEN c.guardian_consent AND c.child_assent THEN 'consented'
                ELSE 'partial' END AS consent_status
    FROM participants p
    LEFT JOIN sessions s USING (participant_id)
    LEFT JOIN LATERAL (SELECT * FROM consent_records cr WHERE cr.participant_id = p.participant_id ORDER BY recorded_at DESC LIMIT 1) c ON TRUE
    ${w.length ? 'WHERE ' + w.join(' AND ') : ''}
    GROUP BY p.participant_id, c.id, c.guardian_consent, c.child_assent, c.withdrawn_at, c.recorded_at
    ORDER BY p.created_at DESC
    LIMIT 2000`, params)
}

export async function sessions(f: ListFilter) {
  const { where, params } = filterSql(f)
  return q(`
    SELECT s.session_id, s.participant_id, s.started_at, s.ended_at,
           ${statusSql()} AS status,
           ROUND(EXTRACT(EPOCH FROM (COALESCE(s.ended_at, s.last_event_at, s.started_at) - s.started_at)))::int AS duration_sec,
           s.pause_count, s.resume_count, p.is_demo,
           ss.assistance_mode, ss.device_type,
           (SELECT count(DISTINCT mission_id) FROM mission_events e WHERE e.session_id = s.session_id AND e.event_type = 'answer' AND e.is_correct)::int AS missions_completed,
           (SELECT count(*) FROM mission_events e WHERE e.session_id = s.session_id AND e.event_type = 'mission_skip')::int AS missions_skipped,
           (SELECT count(*) FROM mission_events e WHERE e.session_id = s.session_id AND e.event_type = 'hint')::int AS hints,
           (SELECT count(*) FROM assistance_events a WHERE a.session_id = s.session_id)::int AS assists
    FROM sessions s JOIN participants p USING (participant_id)
    LEFT JOIN session_settings ss USING (session_id)
    ${where}
    ORDER BY s.started_at DESC
    LIMIT 5000`, params)
}

/** แถวคำตอบทุกครั้ง (สำหรับตาราง Mission และ Export) */
export async function missionRows(f: ListFilter) {
  const { where, params } = filterSql(f)
  return q(`
    SELECT e.session_id, s.participant_id, e.mission_id, e.choice_id, e.is_correct, e.attempt,
           e.hint_level AS hints_used_before_answer, e.caregiver_assisted, e.response_ms, e.occurred_at AS answered_at,
           (SELECT min(occurred_at) FROM mission_events m WHERE m.session_id = e.session_id AND m.mission_id = e.mission_id AND m.event_type = 'mission_start') AS mission_started_at
    FROM mission_events e JOIN sessions s USING (session_id) JOIN participants p USING (participant_id)
    ${where ? where + ' AND' : 'WHERE'} e.event_type = 'answer'
    ORDER BY e.occurred_at DESC
    LIMIT 20000`, params)
}

export async function missionStats(f: ListFilter) {
  const { where, params } = filterSql(f)
  const and = where ? where + ' AND' : 'WHERE'
  const rows = await q(`
    SELECT e.mission_id,
      count(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'mission_start') AS started,
      count(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'answer' AND e.is_correct) AS completed,
      count(*) FILTER (WHERE e.event_type = 'answer') AS answers,
      count(*) FILTER (WHERE e.event_type = 'answer' AND e.attempt = 1) AS first_attempts,
      count(*) FILTER (WHERE e.event_type = 'answer' AND e.attempt = 1 AND e.is_correct) AS first_correct,
      count(*) FILTER (WHERE e.event_type = 'answer' AND e.choice_id = 'A') AS choice_a,
      count(*) FILTER (WHERE e.event_type = 'answer' AND e.choice_id = 'B') AS choice_b,
      count(*) FILTER (WHERE e.event_type = 'hint') AS hints,
      count(*) FILTER (WHERE e.event_type = 'mission_skip') AS skipped,
      ROUND(avg(e.response_ms) FILTER (WHERE e.event_type = 'answer' AND e.is_correct))::int AS avg_ms_to_correct
    FROM mission_events e JOIN sessions s USING (session_id) JOIN participants p USING (participant_id)
    ${and} e.mission_id IS NOT NULL
    GROUP BY e.mission_id`, params)
  const by = new Map(rows.map(r => [r.mission_id as string, r]))
  return MISSIONS.map(m => {
    const r = by.get(m.id) ?? {}
    return {
      ...m,
      started: n(r.started), completed: n(r.completed), answers: n(r.answers),
      firstCorrect: n(r.first_correct),
      firstAttemptCorrectRate: rate(n(r.first_correct), n(r.first_attempts)),
      completionRate: rate(n(r.completed), n(r.started)),
      choiceA: n(r.choice_a), choiceB: n(r.choice_b),
      hints: n(r.hints), skipped: n(r.skipped),
      avgSecondsToCorrect: r.avg_ms_to_correct == null ? null : Math.round(n(r.avg_ms_to_correct) / 100) / 10,
    }
  })
}

export async function analytics(f: ListFilter) {
  const missions = await missionStats(f)
  const ses = await sessions(f)
  const { where, params } = filterSql(f)
  // การตอบครั้งแรกของแต่ละภารกิจ แยกตามประเภทการช่วยเหลือ
  const assist = await q(`
    SELECT CASE WHEN e.caregiver_assisted THEN 'caregiver'
                WHEN COALESCE(e.hint_level,0) > 0 THEN 'after_hint'
                ELSE 'independent' END AS kind,
           count(*) AS total, count(*) FILTER (WHERE e.is_correct) AS correct
    FROM mission_events e JOIN sessions s USING (session_id) JOIN participants p USING (participant_id)
    ${where ? where + ' AND' : 'WHERE'} e.event_type = 'answer' AND e.attempt = 1
    GROUP BY 1`, params)
  const kinds = ['independent', 'after_hint', 'caregiver'].map(k => {
    const r = assist.find(x => x.kind === k)
    return { kind: k, total: n(r?.total), correct: n(r?.correct), correctRate: rate(n(r?.correct), n(r?.total)) }
  })
  const started = missions.reduce((a, m) => a + m.started, 0)
  const completed = missions.reduce((a, m) => a + m.completed, 0)
  const statusCounts: Record<string, number> = { started: 0, in_progress: 0, completed: 0, interrupted: 0, abandoned: 0 }
  for (const s of ses) statusCounts[s.status as string] = (statusCounts[s.status as string] ?? 0) + 1
  return {
    overallMissionCompletionRate: rate(completed, started),
    missions,
    sessionDurations: ses.slice(0, 200).reverse().map(s => ({ sessionId: s.session_id, participantId: s.participant_id, startedAt: s.started_at, durationSec: n(s.duration_sec), status: s.status })),
    statusCounts,
    assistance: kinds,
  }
}

export async function participantDetail(id: string) {
  const [p] = await participants({ q: id, demo: 'include' }).then(r => r.filter(x => x.participant_id === id))
  if (!p) return null
  const ses = await q(`
    SELECT s.session_id, s.started_at, s.ended_at, ${statusSql()} AS status, s.pause_count, s.resume_count,
           ROUND(EXTRACT(EPOCH FROM (COALESCE(s.ended_at, s.last_event_at, s.started_at) - s.started_at)))::int AS duration_sec
    FROM sessions s WHERE s.participant_id = $1 ORDER BY s.started_at DESC`, [id])
  const events = await q(`
    SELECT e.session_id, e.event_type, e.mission_id, e.choice_id, e.is_correct, e.attempt, e.hint_level, e.response_ms, e.caregiver_assisted, e.step_index, e.occurred_at
    FROM mission_events e JOIN sessions s USING (session_id)
    WHERE s.participant_id = $1 AND e.event_type <> 'step_view' ORDER BY e.occurred_at`, [id])
  const assists = await q(`
    SELECT a.session_id, 'assist' AS event_type, a.mission_id, a.occurred_at
    FROM assistance_events a JOIN sessions s USING (session_id) WHERE s.participant_id = $1`, [id])
  const consent = await q('SELECT guardian_consent, child_assent, form_reference, note, recorded_at, withdrawn_at FROM consent_records WHERE participant_id = $1 ORDER BY recorded_at DESC', [id])

  const done = new Set(events.filter(e => e.event_type === 'answer' && e.is_correct).map(e => e.mission_id as string))
  const perMission = MISSIONS.map(m => {
    const ans = events.filter(e => e.event_type === 'answer' && e.mission_id === m.id)
    return {
      ...m,
      completed: done.has(m.id),
      answers: ans.map(a => ({ choiceId: a.choice_id, isCorrect: a.is_correct, attempt: a.attempt, responseMs: a.response_ms, at: a.occurred_at, sessionId: a.session_id })),
      hints: events.filter(e => e.event_type === 'hint' && e.mission_id === m.id).length,
      assists: assists.filter(a => a.mission_id === m.id).length,
    }
  })
  const timeline = [...events, ...assists].sort((a, b) => new Date(a.occurred_at as string).getTime() - new Date(b.occurred_at as string).getTime())
  return { participant: p, sessions: ses, missions: perMission, timeline, consent }
}
