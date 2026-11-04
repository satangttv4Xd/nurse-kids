// การตั้งค่าเซิร์ฟเวอร์ — อ่านจาก environment variables (ดู .env.example)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// โหลด .env แบบง่าย (ไม่ทับค่าที่ตั้งไว้แล้ว)
const envFile = resolve(ROOT, '.env')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const env = process.env
/** กำลังรันบน Vercel (serverless) */
const serverless = !!env.VERCEL
export const isProd = env.NODE_ENV === 'production' || serverless

function devSecret(): string {
  const file = resolve(ROOT, 'database', '.dev-jwt-secret')
  if (existsSync(file)) return readFileSync(file, 'utf8').trim()
  mkdirSync(dirname(file), { recursive: true })
  const s = randomBytes(48).toString('hex')
  writeFileSync(file, s)
  return s
}

if (isProd && (!env.JWT_SECRET || env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET (อย่างน้อย 32 ตัวอักษร) ต้องตั้งค่าใน production')
}

export const config = {
  port: Number(env.PORT ?? 3001),
  /** ถ้าตั้ง DATABASE_URL จะใช้ PostgreSQL จริง ไม่ตั้ง = ใช้ PGlite (PostgreSQL ในเครื่องสำหรับพัฒนา) */
  databaseUrl: env.DATABASE_URL || null,
  /** ใบรับรอง CA ของฐานข้อมูล (PEM) — ตั้งแล้วจะตรวจใบรับรองเต็มรูปแบบ (Supabase: Settings → Database → SSL) */
  databaseCaCert: env.DATABASE_CA_CERT?.replace(/\\n/g, '\n') || null,
  serverless,
  pgliteDir: resolve(ROOT, env.PGLITE_DIR ?? 'database/data'),
  jwtSecret: env.JWT_SECRET || devSecret(),
  /** ปิดการรับข้อมูลจากเกม (เช่น ก่อนได้รับอนุมัติจริยธรรม) ตั้งเป็น false */
  collectionEnabled: (env.COLLECTION_ENABLED ?? 'true') !== 'false',
  /** ระยะเวลาเก็บข้อมูล (วัน) ตามนโยบายโครงการ — ใช้กับปุ่มลบข้อมูลหมดอายุ */
  retentionDays: Number(env.RETENTION_DAYS ?? 1825),
  /** ถือว่า session ถูกละทิ้ง ถ้าไม่มีความเคลื่อนไหวเกินกี่นาที */
  abandonAfterMinutes: Number(env.ABANDON_AFTER_MINUTES ?? 30),
  adminUsername: env.ADMIN_USERNAME,
  adminPassword: env.ADMIN_PASSWORD,
  isProd,
}
