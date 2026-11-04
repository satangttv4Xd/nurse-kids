// API ของ Dashboard — ทุกเส้นต้องล็อกอิน และตรวจสิทธิ์ตาม Role
import { Router } from 'express'
import { audit, requireAuth, requireRole } from '../auth.ts'
import { q } from '../db.ts'
import * as A from '../services/analytics.ts'
import { toCsv, toXlsx } from '../services/export.ts'
import { consentBody, exportQuery, listFilter, participantId } from '../validators.ts'

export const dashboardRouter = Router()
dashboardRouter.use(requireAuth)

// Viewer ขึ้นไป: รายงานภาพรวม (ไม่มีข้อมูลรายบุคคล)
dashboardRouter.get('/overview', requireRole('viewer'), async (req, res) => {
  res.json(await A.overview(listFilter.parse(req.query)))
})
dashboardRouter.get('/missions', requireRole('viewer'), async (req, res) => {
  res.json(await A.missionStats(listFilter.parse(req.query)))
})
dashboardRouter.get('/analytics', requireRole('viewer'), async (req, res) => {
  res.json(await A.analytics(listFilter.parse(req.query)))
})

// Researcher ขึ้นไป: ข้อมูลรายบุคคล + ส่งออก
dashboardRouter.get('/participants', requireRole('researcher'), async (req, res) => {
  res.json(await A.participants(listFilter.parse(req.query)))
})
dashboardRouter.get('/participants/:id', requireRole('researcher'), async (req, res) => {
  const id = participantId.parse(req.params.id)
  const d = await A.participantDetail(id)
  if (!d) return res.status(404).json({ error: 'ไม่พบผู้เข้าร่วม' })
  await audit(req, 'view_participant', id)
  res.json(d)
})
dashboardRouter.get('/sessions', requireRole('researcher'), async (req, res) => {
  res.json(await A.sessions(listFilter.parse(req.query)))
})
dashboardRouter.get('/mission-events', requireRole('researcher'), async (req, res) => {
  res.json(await A.missionRows(listFilter.parse(req.query)))
})

dashboardRouter.post('/participants/:id/consent', requireRole('researcher'), async (req, res) => {
  const id = participantId.parse(req.params.id)
  const b = consentBody.parse(req.body)
  const r = await q(`INSERT INTO consent_records (participant_id, guardian_consent, child_assent, form_reference, note, recorded_by, withdrawn_at)
                     SELECT $1,$2,$3,$4,$5,$6, CASE WHEN $7 THEN now() END WHERE EXISTS (SELECT 1 FROM participants WHERE participant_id = $1)
                     RETURNING id`, [id, b.guardianConsent, b.childAssent, b.formReference || null, b.note || null, req.user!.id, b.withdrawn])
  if (!r.length) return res.status(404).json({ error: 'ไม่พบผู้เข้าร่วม' })
  await audit(req, 'record_consent', id, { guardian: b.guardianConsent, assent: b.childAssent, withdrawn: b.withdrawn })
  res.status(201).json({ ok: true })
})

dashboardRouter.get('/export', requireRole('researcher'), async (req, res) => {
  const f = exportQuery.parse(req.query)
  const sets: Record<string, () => Promise<Record<string, unknown>[]>> = {
    participants: async () => (await A.participants(f)).map(({ nickname: _n, ...r }) => r), // ไม่ส่งออกชื่อเล่น
    sessions: () => A.sessions(f),
    missions: () => A.missionRows(f),
  }
  const names = f.dataset === 'all' ? Object.keys(sets) : [f.dataset]
  const data: Record<string, Record<string, unknown>[]> = {}
  for (const n of names) data[n] = await sets[n]()
  await audit(req, 'export', f.dataset, { format: f.format, filter: { q: f.q, from: f.from, to: f.to, demo: f.demo }, rows: Object.values(data).reduce((a, r) => a + r.length, 0) })

  const stamp = new Date().toISOString().slice(0, 10)
  if (f.format === 'xlsx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="littlesteps-${f.dataset}-${stamp}.xlsx"`)
    return res.send(await toXlsx(data))
  }
  if (names.length > 1) {
    // CSV หลายชุด: รวมเป็นไฟล์เดียว คั่นด้วยหัวข้อ
    const body = names.map(n => `# ${n}\r\n${toCsv(data[n]).replace(/^﻿/, '')}`).join('\r\n\r\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="littlesteps-all-${stamp}.csv"`)
    return res.send('﻿' + body)
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="littlesteps-${f.dataset}-${stamp}.csv"`)
  res.send(toCsv(data[names[0]]))
})
