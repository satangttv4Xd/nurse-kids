// จุดเข้าของ Vercel Function — Vercel เรียก (req, res) ทุกคำขอที่ขึ้นต้นด้วย /api
// ถูก bundle เป็น .vercel/output/functions/api.func/index.mjs โดย scripts/build-vercel.mjs
import { app } from './app.ts'

export default app
