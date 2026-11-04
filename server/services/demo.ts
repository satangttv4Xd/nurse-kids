// สร้าง "ข้อมูลตัวอย่าง" สำหรับทดลองดู Dashboard — ทุกแถวมี is_demo = TRUE และ Dashboard แสดงป้าย "ข้อมูลตัวอย่าง" เสมอ
// ไม่ใช่ข้อมูลของเด็กจริง
import { randomUUID } from 'node:crypto'
import { q } from '../db.ts'

export async function clearDemo() {
  return (await q('DELETE FROM participants WHERE is_demo RETURNING participant_id')).length
}

export async function seedDemo() {
  await clearDemo()
  // ตัวสุ่มแบบกำหนด seed เพื่อให้ได้ข้อมูลเหมือนเดิมทุกครั้ง
  let seed = 42
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]
  const hex = () => Math.floor(rnd() * 0xffffffff).toString(16).toUpperCase().padStart(8, '0')

  const CORRECT: Record<string, 'A' | 'B'> = { M01: 'A', M02: 'B', M03: 'A', M04: 'B', M05: 'A', M06: 'B', M07: 'A', M08: 'A' }
  const MISSIONS = Object.keys(CORRECT)
  const now = Date.now()

  let sessions = 0
  for (let i = 0; i < 14; i++) {
    const pid = `P-${hex()}`
    const joined = now - (30 - i * 2) * 86400_000
    await q('INSERT INTO participants (participant_id, nickname, is_demo, created_at) VALUES ($1, $2, TRUE, $3)', [pid, 'ตัวอย่าง', new Date(joined).toISOString()])
    if (rnd() < 0.75) {
      await q('INSERT INTO consent_records (participant_id, guardian_consent, child_assent, form_reference) VALUES ($1, TRUE, $2, $3)', [pid, rnd() < 0.9, `DEMO-${i + 1}`])
    }
    const nSessions = 1 + Math.floor(rnd() * 3)
    for (let k = 0; k < nSessions; k++) {
      const sid = randomUUID()
      let t = joined + k * 86400_000 + Math.floor(rnd() * 3600_000)
      const started = t
      const mode = pick(['independent', 'independent', 'guided', 'supported'])
      // ส่วนใหญ่เล่นจบ บางส่วนหยุดกลางทาง
      const stopAt = rnd() < 0.7 ? 8 : 1 + Math.floor(rnd() * 7)
      const events: unknown[][] = []
      const assists: unknown[][] = []
      let pauses = 0, resumes = 0
      for (let m = 0; m < stopAt; m++) {
        const mid = MISSIONS[m]
        t += 40_000 + rnd() * 50_000
        events.push([randomUUID(), sid, 'mission_start', mid, null, null, null, null, null, false, new Date(t).toISOString()])
        const startT = t
        let hints = 0
        if (rnd() < 0.25) { hints = 1; t += 8000; events.push([randomUUID(), sid, 'hint', mid, null, null, null, 1, null, false, new Date(t).toISOString()]) }
        const assisted = mode === 'supported' && rnd() < 0.6
        if (assisted) { t += 3000; assists.push([randomUUID(), sid, mid, new Date(t).toISOString()]) }
        let attempt = 0, correct = false
        while (!correct && attempt < 3) {
          attempt++
          t += 5000 + rnd() * 20_000
          correct = rnd() < (hints || assisted ? 0.85 : 0.7) || attempt === 3
          const choice = correct ? CORRECT[mid] : (CORRECT[mid] === 'A' ? 'B' : 'A')
          events.push([randomUUID(), sid, 'answer', mid, choice, correct, attempt, hints, Math.round(t - startT), assisted, new Date(t).toISOString()])
        }
        if (rnd() < 0.12) { pauses++; t += 2000; events.push([randomUUID(), sid, 'pause', null, null, null, null, null, null, false, new Date(t).toISOString()]); resumes++; t += 30_000; events.push([randomUUID(), sid, 'resume', null, null, null, null, null, null, false, new Date(t).toISOString()]) }
      }
      const completed = stopAt === 8
      const status = completed ? 'completed' : pick(['interrupted', 'in_progress'])
      await q(`INSERT INTO sessions (session_id, participant_id, started_at, ended_at, last_event_at, status, pause_count, resume_count, is_demo)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)`,
        [sid, pid, new Date(started).toISOString(), status === 'in_progress' ? null : new Date(t).toISOString(), new Date(t).toISOString(), status, pauses, resumes])
      await q('INSERT INTO session_settings (session_id, assistance_mode, device_type, game_version) VALUES ($1,$2,$3,$4)', [sid, mode, pick(['tablet', 'tablet', 'desktop']), 'demo'])
      for (const e of events) {
        await q(`INSERT INTO mission_events (client_event_id, session_id, event_type, mission_id, choice_id, is_correct, attempt, hint_level, response_ms, caregiver_assisted, occurred_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, e)
      }
      for (const a of assists) await q(`INSERT INTO assistance_events (client_event_id, session_id, mission_id, assistance_type, occurred_at) VALUES ($1,$2,$3,'caregiver_help',$4)`, a)
      sessions++
    }
  }
  return { participants: 14, sessions }
}
