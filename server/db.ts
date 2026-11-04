// ชั้นฐานข้อมูล — ใช้ parameterized query เท่านั้น ($1, $2 ...) เพื่อกัน SQL Injection
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
    const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 })
    return {
      query: async (sql, params = []) => (await pool.query(sql, params)).rows,
      exec: async sql => { await pool.query(sql) },
      close: () => pool.end(),
    }
  }
  const { PGlite } = await import('@electric-sql/pglite')
  const db = new PGlite(config.pgliteDir)
  await db.waitReady
  return {
    query: async (sql, params = []) => (await db.query(sql, params)).rows as never,
    exec: async sql => { await db.exec(sql) },
    close: () => db.close(),
  }
}

export async function initDb() {
  driver = await connect()
  await driver.exec(readFileSync(resolve(ROOT, 'database', 'schema.sql'), 'utf8'))
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
