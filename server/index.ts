// Little Steps — Research API server (Express)
// รัน: npm run server  (พัฒนา)  /  NODE_ENV=production npm run server  (ใช้งานจริง หลัง npm run build)
import express, { type NextFunction, type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { ZodError } from 'zod'
import { audit, bootstrapAdmin, clearSessionCookie, requireAuth, setSessionCookie, verifyPassword, type Role } from './auth.ts'
import { config, ROOT } from './config.ts'
import { closeDb, initDb, q, q1 } from './db.ts'
import { loginBody } from './validators.ts'
import { gameRouter } from './routes/game.ts'
import { dashboardRouter } from './routes/dashboard.ts'
import { adminRouter } from './routes/admin.ts'

const app = express()
app.set('trust proxy', 1) // อยู่หลัง reverse proxy (HTTPS) ใน production
app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: config.isProd ? undefined : false }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

// ---------- เกม ----------
app.use(['/api/participants', '/api/sessions', '/api/events'], rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }))
app.use('/api', gameRouter)

// ---------- เข้าสู่ระบบ ----------
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาที' } })

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const b = loginBody.parse(req.body)
  const u = await q1<{ id: string; username: string; role: Role; password_hash: string; is_active: boolean }>(
    'SELECT id, username, role, password_hash, is_active FROM admin_users WHERE username = $1', [b.username])
  const ok = u && u.is_active && await verifyPassword(b.password, u.password_hash)
  if (!ok) {
    await audit(req, 'login_failed', b.username)
    return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
  }
  const user = { id: Number(u.id), username: u.username, role: u.role }
  setSessionCookie(res, user)
  await q('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [user.id])
  req.user = user
  await audit(req, 'login')
  res.json({ user })
})

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  await audit(req, 'logout')
  clearSessionCookie(res)
  res.json({ ok: true })
})

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }))

app.get('/api/health', (_req, res) => res.json({ ok: true, collectionEnabled: config.collectionEnabled }))

// ---------- Dashboard / Admin ----------
app.use('/api/dashboard', dashboardRouter)
app.use('/api/admin', adminRouter)
app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }))

// ---------- ไฟล์เว็บ (production) ----------
const dist = resolve(ROOT, 'dist')
if (config.isProd && existsSync(dist)) {
  app.use(express.static(dist, { index: 'index.html' }))
  app.get('/dashboard', (_req, res) => res.sendFile(resolve(dist, 'dashboard.html')))
}

// ---------- จัดการ error ----------
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', issues: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })) })
  if (err && typeof err === 'object' && 'type' in err && (err as { type: string }).type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid_json' })
  console.error(err)
  res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' })
})

const dbName = await initDb()
await bootstrapAdmin()
const server = app.listen(config.port, () => {
  console.log(`Little Steps API → http://localhost:${config.port}  (DB: ${dbName})`)
  if (!config.collectionEnabled) console.log('⚠️  COLLECTION_ENABLED=false — ไม่รับข้อมูลจากเกม')
})

// ปิดฐานข้อมูลอย่างถูกต้องเมื่อหยุดเซิร์ฟเวอร์ (สำคัญสำหรับ PGlite)
let closing = false
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    if (closing) return
    closing = true
    server.close()
    await closeDb()
    process.exit(0)
  })
}
