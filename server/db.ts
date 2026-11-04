// ชั้นฐานข้อมูล — ใช้ parameterized query เท่านั้น ($1, $2 ...) เพื่อกัน SQL Injection
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config, ROOT } from './config.ts'

export type Row = Record<string, unknown>

interface Driver {
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>
  exec(sql: string): Promise<void>
  close(): Promise<void>
}

let driver: Driver | null = null

async function connect(): Promise<Driver> {
  if (config.databaseUrl) {
    const { default: pg } = await import('pg')
    const url = new URL(config.databaseUrl)
    // ค่า sslmode ใน URL จะทับการตั้งค่า ssl ด้านล่าง จึงตัดออกแล้วตั้งเอง
    url.searchParams.delete('sslmode')
    const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    // ฐานข้อมูลนอกเครื่อง: เข้ารหัส + ตรวจใบรับรองเสมอ
    // Supabase ใช้ CA ของตัวเอง ต้องตั้ง DATABASE_CA_CERT (ดาวน์โหลดจาก Supabase → Database Settings → SSL)
    const ssl = local ? undefined : config.databaseCaCert ? { ca: config.databaseCaCert, rejectUnauthorized: true } : true
    const pool = new pg.Pool({
      connectionString: url.toString(),
      ssl,
      // serverless: แต่ละ instance ใช้ connection น้อย ๆ ผ่าน connection pooler ของ Supabase
      max: config.serverless ? 2 : 10,
      idleTimeoutMillis: config.serverless ? 10_000 : 30_000,
      connectionTimeoutMillis: 10_000,
    })
    return {
      query: async (sql, params = []) => (await pool.query(sql, params)).rows,
      exec: async sql => { await pool.query(sql) },
      close: () => pool.end(),
    }
  }
  if (config.serverless) throw new Error('บน Vercel ต้องตั้ง DATABASE_URL (เช่น Supabase) — PGlite ใช้ได้เฉพาะในเครื่อง')
  const { PGlite } = await import('@electric-sql/pglite')
  const db = new PGlite(config.pgliteDir)
  await db.waitReady
  return {
    query: async (sql, params = []) => (await db.query(sql, params)).rows as never,
    exec: async sql => { await db.exec(sql) },
    close: () => db.close(),
  }
}

// ตำแหน่ง schema.sql — ในโปรเจกต์ หรือข้างไฟล์ bundle บน Vercel
const SCHEMA_CANDIDATES = [
  resolve(ROOT, 'database', 'schema.sql'),
  resolve(dirname(fileURLToPath(import.meta.url)), 'schema.sql'),
]

export async function initDb() {
  driver = await connect()
  const schema = SCHEMA_CANDIDATES.find(f => existsSync(f))
  if (!schema) throw new Error('ไม่พบ database/schema.sql')
  await driver.exec(readFileSync(schema, 'utf8'))
  return config.databaseUrl ? 'PostgreSQL' : `PGlite (${config.pgliteDir})`
}

export function q<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!driver) throw new Error('database not initialised')
  return driver.query<T>(sql, params)
}

export async function q1<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await q<T>(sql, params))[0]
}

export const closeDb = () => driver?.close()
