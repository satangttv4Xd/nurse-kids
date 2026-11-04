// สร้างไฟล์สำหรับ deploy บน Vercel (Build Output API v3) — รันโดย `npm run build:vercel`
//   .vercel/output/static/                 ← เกม + dashboard (จาก vite build → dist/)
//   .vercel/output/functions/api.func/     ← API server (Express) bundle เป็นไฟล์เดียว
//   .vercel/output/config.json             ← เส้นทาง /api/* → function
import { build } from 'rolldown'
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'

const OUT = '.vercel/output'
const FN = `${OUT}/functions/api.func`

rmSync(OUT, { recursive: true, force: true })
mkdirSync(FN, { recursive: true })

// 1) ไฟล์เว็บ
cpSync('dist', `${OUT}/static`, { recursive: true })

// 2) API function
await build({
  input: 'server/vercel.ts',
  platform: 'node',
  // pg-native = ตัวเลือกเสริมของ pg (ไม่ใช้) · PGlite ใช้เฉพาะในเครื่อง
  external: ['pg-native', '@electric-sql/pglite'],
  output: { file: `${FN}/index.mjs`, format: 'esm', codeSplitting: false },
  logLevel: 'warn',
})
cpSync('database/schema.sql', `${FN}/schema.sql`)
writeFileSync(`${FN}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  shouldAddHelpers: false, // ให้ Express อ่าน body เอง
  maxDuration: 30,
}, null, 2))

// 3) เส้นทาง + security headers สำหรับไฟล์เว็บ
const security = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000',
}
writeFileSync(`${OUT}/config.json`, JSON.stringify({
  version: 3,
  routes: [
    { src: '/(.*)', headers: security, continue: true },
    { src: '/dashboard/?', dest: '/dashboard.html' },
    { handle: 'filesystem' },
    { src: '/api(?:/.*)?', dest: '/api' },
  ],
}, null, 2))

console.log(`✓ Vercel output → ${OUT}`)
