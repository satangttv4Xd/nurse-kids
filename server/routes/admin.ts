// API สำหรับ Admin เท่านั้น: จัดการผู้ใช้, ลบข้อมูล, นโยบายเก็บรักษา, ดู Audit Log
import { Router } from 'express'
import { audit, hashPassword, requireAuth, requireRole } from '../auth.ts'
import { config } from '../config.ts'
import { q } from '../db.ts'
import { participantId, userBody, userPatch } from '../validators.ts'
import { clearDemo, seedDemo } from '../services/demo.ts'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireRole('admin'))

adminRouter.get('/users', async (_req, res) => {
  res.json(await q('SELECT id, username, role, is_active, created_at, last_login_at FROM admin_users ORDER BY id'))
})

adminRouter.post('/users', async (req, res) => {
  const b = userBody.parse(req.body)
  const r = await q(`INSERT INTO admin_users (username, password_hash, role) VALUES ($1,$2,$3)
                     ON CONFLICT (username) DO NOTHING RETURNING id`, [b.username, await hashPassword(b.password), b.role])
  if (!r.length) return res.status(409).json({ error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' })
  await audit(req, 'create_user', b.username, { role: b.role })
  res.status(201).json({ id: r[0].id })
})

adminRouter.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' })
  const b = userPatch.parse(req.body)
  if (id === req.user!.id && (b.isActive === false || (b.role && b.role !== 'admin'))) {
    return res.status(400).json({ error: 'ไม่สามารถลดสิทธิ์หรือปิดบัญชีของตัวเองได้' })
  }
  if (b.role) await q('UPDATE admin_users SET role = $2 WHERE id = $1', [id, b.role])
  if (b.isActive !== undefined) await q('UPDATE admin_users SET is_active = $2 WHERE id = $1', [id, b.isActive])
  if (b.password) await q('UPDATE admin_users SET password_hash = $2 WHERE id = $1', [id, await hashPassword(b.password)])
  await audit(req, 'update_user', String(id), { role: b.role, isActive: b.isActive, passwordChanged: !!b.password })
  res.json({ ok: true })
})

/** ลบผู้เข้าร่วมและข้อมูลทั้งหมด (เช่น เมื่อถอนความยินยอม) */
adminRouter.delete('/participants/:id', async (req, res) => {
  const id = participantId.parse(req.params.id)
  const r = await q('DELETE FROM participants WHERE participant_id = $1 RETURNING participant_id', [id])
  if (!r.length) return res.status(404).json({ error: 'ไม่พบผู้เข้าร่วม' })
  await audit(req, 'delete_participant', id)
  res.json({ ok: true })
})

/** ลบข้อมูลที่เกินระยะเวลาเก็บรักษาตามนโยบาย */
adminRouter.get('/retention', async (_req, res) => {
  const [r] = await q(`SELECT count(*)::int AS n FROM participants WHERE created_at < now() - make_interval(days => $1)`, [config.retentionDays])
  res.json({ retentionDays: config.retentionDays, expiredParticipants: r.n })
})
adminRouter.post('/retention/purge', async (req, res) => {
  const r = await q(`DELETE FROM participants WHERE created_at < now() - make_interval(days => $1) RETURNING participant_id`, [config.retentionDays])
  await audit(req, 'retention_purge', undefined, { retentionDays: config.retentionDays, deleted: r.length })
  res.json({ deleted: r.length })
})

/** ลบข้อมูลตัวอย่าง (Demo) ทั้งหมด */
adminRouter.post('/demo/clear', async (req, res) => {
  const deleted = await clearDemo()
  await audit(req, 'demo_clear', undefined, { deleted })
  res.json({ deleted })
})

/** ใส่ข้อมูลตัวอย่าง (is_demo = TRUE) สำหรับทดลองระบบ */
adminRouter.post('/demo/seed', async (req, res) => {
  const r = await seedDemo()
  await audit(req, 'demo_seed', undefined, r)
  res.json(r)
})

adminRouter.get('/audit-logs', async (_req, res) => {
  res.json(await q('SELECT id, username, action, target, detail, ip, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 500'))
})
