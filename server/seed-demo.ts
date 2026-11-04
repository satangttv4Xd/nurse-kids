// ใส่/ลบข้อมูลตัวอย่างจาก command line
// ⚠️ ถ้าใช้ PGlite (ไม่ได้ตั้ง DATABASE_URL) ต้องหยุดเซิร์ฟเวอร์ก่อน — หรือกดปุ่มในหน้า Admin แทน
// รัน: npm run demo:seed   /   npm run demo:clear
import { closeDb, initDb } from './db.ts'
import { clearDemo, seedDemo } from './services/demo.ts'

await initDb()
if (process.argv.includes('--clear')) console.log(`ลบข้อมูลตัวอย่างแล้ว ${await clearDemo()} คน`)
else {
  const r = await seedDemo()
  console.log(`ใส่ข้อมูลตัวอย่างแล้ว: ผู้เข้าร่วม ${r.participants} คน, ${r.sessions} sessions (is_demo = TRUE)`)
}
await closeDb()
