// การยืนยันตัวตนผู้ดูแล: รหัสผ่านเข้ารหัสด้วย bcrypt, session เก็บเป็น JWT ใน cookie แบบ httpOnly
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { config } from './config.ts'
import { q, q1 } from './db.ts'

export type Role = 'admin' | 'researcher' | 'viewer'
export interface AuthUser { id: number; username: string; role: Role }

const COOKIE = 'ls_admin'
const RANK: Record<Role, number> = { viewer: 1, researcher: 2, admin: 3 }

export const hashPassword = (p: string) => bcrypt.hash(p, 12)
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h)

export function setSessionCookie(res: Response, user: AuthUser) {
  const token = jwt.sign({ sub: String(user.id), username: user.username, role: user.role }, config.jwtSecret, { expiresIn: '8h' })
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: config.isProd, maxAge: 8 * 3600 * 1000, path: '/api' })
}

export const clearSessionCookie = (res: Response) => res.clearCookie(COOKIE, { path: '/api' })

declare module 'express-serve-static-core' {
  interface Request { user?: AuthUser }
}

/** ตรวจ cookie + ตรวจว่าผู้ใช้ยัง active อยู่ในฐานข้อมูล */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE]
    if (!token) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' })
    const p = jwt.verify(token, config.jwtSecret) as { sub: string }
    const u = await q1<{ id: string; username: string; role: Role; is_active: boolean }>(
      'SELECT id, username, role, is_active FROM admin_users WHERE id = $1', [Number(p.sub)])
    if (!u || !u.is_active) return res.status(401).json({ error: 'บัญชีถูกปิดการใช้งาน' })
    req.user = { id: Number(u.id), username: u.username, role: u.role }
    next()
  } catch {
    res.status(401).json({ error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' })
  }
}

export const requireRole = (min: Role) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || RANK[req.user.role] < RANK[min]) return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' })
  next()
}

export async function audit(req: Request, action: string, target?: string, detail?: unknown) {
  await q('INSERT INTO audit_logs (user_id, username, action, target, detail, ip) VALUES ($1,$2,$3,$4,$5,$6)',
    [req.user?.id ?? null, req.user?.username ?? null, action, target ?? null, detail ? JSON.stringify(detail) : null, req.ip ?? null])
}

/** สร้างผู้ดูแลระบบคนแรก ถ้ายังไม่มีผู้ใช้เลย */
export async function bootstrapAdmin() {
  const row = await q1<{ n: string }>('SELECT count(*)::text AS n FROM admin_users')
  if (Number(row?.n) > 0) return
  let username = config.adminUsername
  let password = config.adminPassword
  let generated = false
  if (!username || !password) {
    if (config.isProd) throw new Error('ยังไม่มีผู้ดูแลระบบ — ตั้ง ADMIN_USERNAME และ ADMIN_PASSWORD เพื่อสร้างบัญชีแรก')
    username = 'admin'
    password = randomBytes(9).toString('base64url')
    generated = true
  }
  await q('INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, $3)', [username, await hashPassword(password), 'admin'])
  console.log('\n────────────────────────────────────────')
  console.log(' สร้างบัญชีผู้ดูแลระบบคนแรกแล้ว')
  console.log(`   username: ${username}`)
  if (generated) console.log(`   password: ${password}   ← จดไว้ จะแสดงครั้งเดียว`)
  console.log('────────────────────────────────────────\n')
}
