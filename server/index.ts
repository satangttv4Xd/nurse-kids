// Little Steps — Research API server (เซิร์ฟเวอร์ปกติ)
// รัน: npm run server  (พัฒนา)  /  NODE_ENV=production npm run server  (ใช้งานจริง หลัง npm run build)
// บน Vercel ใช้ server/vercel.ts แทน (ดู docs/DEPLOY_VERCEL_SUPABASE.md)
import { app, init } from './app.ts'
import { config } from './config.ts'
import { closeDb } from './db.ts'

const dbName = await init()
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
