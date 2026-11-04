// API ที่เกมเรียก (ไม่ต้องล็อกอิน แต่จำกัดอัตราการเรียก และตรวจข้อมูลทุกช่อง)
import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { config } from '../config.ts'
import { q, q1 } from '../db.ts'
import { completeSession, createParticipant, createSession, eventBatch } from '../validators.ts'

export const gameRouter = Router()

gameRouter.use(['/participants', '/sessions', '/events'], (_req, res, next) => {
  if (!config.collectionEnabled) return res.status(503).json({ error: 'collection_disabled' })
  next()
})

gameRouter.post('/participants', async (req, res) => {
  const body = createParticipant.parse(req.body)
  const id = body.participantId ?? `P-${randomBytes(4).toString('hex').toUpperCase()}`
  await q('INSERT INTO participants (participant_id, nickname) VALUES ($1, $2) ON CONFLICT (participant_id) DO NOTHING',
    [id, body.nickname || null])
  res.status(201).json({ participantId: id })
})

gameRouter.post('/sessions', async (req, res) => {
  const b = createSession.parse(req.body)
  const p = await q1('SELECT 1 FROM participants WHERE participant_id = $1', [b.participantId])
  if (!p) return res.status(404).json({ error: 'participant_not_found' })
  await q(`INSERT INTO sessions (session_id, participant_id, started_at, last_event_at) VALUES ($1, $2, $3, $3)
           ON CONFLICT (session_id) DO NOTHING`, [b.sessionId, b.participantId, b.startedAt])
  const s = b.settings
  if (s) {
    await q(`INSERT INTO session_settings (session_id, assistance_mode, music_on, voice_on, device_type, game_version)
             VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (session_id) DO NOTHING`,
      [b.sessionId, s.assistanceMode, s.musicOn, s.voiceOn, s.deviceType, s.gameVersion ?? null])
  }
  res.status(201).json({ sessionId: b.sessionId })
})

gameRouter.post('/events', async (req, res) => {
  const { sessionId, events } = eventBatch.parse(req.body)
  const s = await q1<{ status: string }>('SELECT status FROM sessions WHERE session_id = $1', [sessionId])
  if (!s) return res.status(404).json({ error: 'session_not_found' })

  let inserted = 0, pauses = 0, resumes = 0
  let latest = ''
  for (const e of events) {
    if (e.at > latest) latest = e.at
    if (e.type === 'assist') {
      const r = await q(`INSERT INTO assistance_events (client_event_id, session_id, mission_id, assistance_type, occurred_at)
                         VALUES ($1,$2,$3,'caregiver_help',$4) ON CONFLICT (client_event_id) DO NOTHING RETURNING id`,
        [e.eventId, sessionId, e.missionId, e.at])
      inserted += r.length
      continue
    }
    const r = await q(`INSERT INTO mission_events
        (client_event_id, session_id, event_type, mission_id, choice_id, is_correct, attempt, hint_level, response_ms, caregiver_assisted, step_index, occurred_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (client_event_id) DO NOTHING RETURNING id`, [
      e.eventId, sessionId, e.type,
      'missionId' in e ? e.missionId : null,
      e.type === 'answer' ? e.choiceId : null,
      e.type === 'answer' ? e.isCorrect : null,
      e.type === 'answer' ? e.attempt : null,
      e.type === 'answer' ? e.hintsUsed : e.type === 'hint' ? e.level : null,
      e.type === 'answer' ? e.responseMs : null,
      e.type === 'answer' ? e.caregiverAssisted : false,
      'stepIndex' in e ? e.stepIndex : null,
      e.at,
    ])
    if (r.length) {
      inserted++
      if (e.type === 'pause') pauses++
      if (e.type === 'resume') resumes++
    }
  }
  await q(`UPDATE sessions SET
             pause_count = pause_count + $2, resume_count = resume_count + $3,
             last_event_at = GREATEST(COALESCE(last_event_at, $4::timestamptz), $4::timestamptz),
             status = CASE WHEN status = 'started' THEN 'in_progress' ELSE status END
           WHERE session_id = $1`, [sessionId, pauses, resumes, latest])
  res.json({ received: events.length, inserted })
})

gameRouter.post('/sessions/:id/complete', async (req, res) => {
  const id = String(req.params.id)
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'invalid_session_id' })
  const b = completeSession.parse(req.body)
  // ถ้าจบแล้ว (completed) จะไม่ถูกเปลี่ยนกลับเป็น interrupted
  const r = await q(`UPDATE sessions SET ended_at = $2, last_event_at = GREATEST(COALESCE(last_event_at, $2::timestamptz), $2::timestamptz),
                       status = CASE WHEN status = 'completed' THEN status ELSE $3 END
                     WHERE session_id = $1 RETURNING session_id`, [id, b.endedAt, b.status])
  if (!r.length) return res.status(404).json({ error: 'session_not_found' })
  res.json({ ok: true })
})
