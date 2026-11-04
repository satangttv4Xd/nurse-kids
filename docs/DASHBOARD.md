# Research Dashboard — คู่มือติดตั้งและใช้งาน

ระบบเก็บและวิเคราะห์ข้อมูลการเล่นเกม Little Steps: My Health Journey สำหรับโครงการวิจัย

> ⚠️ **ก่อนเก็บข้อมูลจากเด็กจริง** ต้องได้รับอนุมัติจากคณะกรรมการจริยธรรมการวิจัย มีความยินยอมจากผู้ปกครอง (Parent/Guardian Consent) และความยินยอมของเด็ก (Child Assent) ตามความเหมาะสม
> ระหว่างนี้ตั้ง `COLLECTION_ENABLED=false` ได้ เซิร์ฟเวอร์จะไม่รับข้อมูลจากเกม
>
> ผลการเล่นเป็นข้อมูลพฤติกรรมการเรียนรู้ในเกม **ห้ามใช้วินิจฉัยโรคหรือประเมินความสามารถทางการแพทย์ของเด็ก**

---

## 1. โครงสร้าง

```
index.html            เกม (React)
dashboard.html        Dashboard (React + Tailwind + Chart.js + Lucide)
src/game/player.ts    ระบบบันทึกการเล่นในเกม + คิวออฟไลน์
src/dashboard/        หน้า Dashboard
server/               API server (Node.js + Express)
  index.ts            เริ่มเซิร์ฟเวอร์, login/logout
  routes/game.ts      API ที่เกมเรียก
  routes/dashboard.ts API ของ Dashboard (ต้องล็อกอิน)
  routes/admin.ts     API ของ Admin
  services/           คำนวณสถิติ, ส่งออก, ข้อมูลตัวอย่าง
  validators.ts       ตรวจข้อมูลทุกช่องก่อนบันทึก
database/schema.sql   PostgreSQL schema (8 ตาราง)
```

## 2. ติดตั้ง (เครื่องพัฒนา)

ต้องมี Node.js 24 ขึ้นไป

```bash
npm install --legacy-peer-deps
npm run dev          # เปิดทั้งเกม (5173) และ API (3001) พร้อมกัน
```

- เกม: http://localhost:5173
- Dashboard: http://localhost:5173/dashboard.html

ครั้งแรกที่รัน ระบบสร้างบัญชี `admin` พร้อมรหัสผ่านสุ่ม **แสดงในหน้าจอ terminal ครั้งเดียว** ให้จดไว้
(หรือตั้ง `ADMIN_USERNAME` / `ADMIN_PASSWORD` ใน `.env` ก่อนรันครั้งแรก)

### ฐานข้อมูล

- **ไม่ตั้ง `DATABASE_URL`** → ใช้ PGlite (PostgreSQL ที่ฝังในโปรแกรม ไม่ต้องติดตั้ง) เก็บไฟล์ที่ `database/data`
  เหมาะสำหรับพัฒนาและทดลองเท่านั้น — เปิดได้ทีละโปรเซส และต้องหยุดเซิร์ฟเวอร์ด้วย Ctrl+C (ห้ามปิดแบบบังคับ)
- **ใช้งานจริง ให้ใช้ PostgreSQL** แล้วตั้ง `DATABASE_URL` ในไฟล์ `.env` — ตารางถูกสร้างอัตโนมัติจาก `database/schema.sql`

```sql
CREATE USER littlesteps WITH PASSWORD '...';
CREATE DATABASE littlesteps OWNER littlesteps;
```

## 3. ติดตั้งใช้งานจริง (Production)

```bash
cp .env.example .env      # แก้: DATABASE_URL, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD, NODE_ENV=production
npm run build
npm start                 # เซิร์ฟเวอร์ให้บริการทั้งเกม (/), Dashboard (/dashboard.html) และ API (/api)
```

- **ต้องใช้ HTTPS** — วางเซิร์ฟเวอร์ไว้หลัง reverse proxy (เช่น Nginx/Caddy) ที่มีใบรับรอง TLS
  (ใน production cookie ของผู้ดูแลตั้งเป็น `Secure` จึงใช้ผ่าน HTTPS เท่านั้น)
- สำรองฐานข้อมูล PostgreSQL ตามรอบ และเข้ารหัสดิสก์ของเซิร์ฟเวอร์ (encryption at rest)
- จำกัดการเข้าถึง `/dashboard.html` ด้วย firewall/VPN ได้อีกชั้นหนึ่ง

## 4. การใช้งาน Dashboard

| เมนู | สิทธิ์ขั้นต่ำ | ทำอะไรได้ |
|---|---|---|
| ภาพรวม | Viewer | การ์ดสรุป 6 ใบ + กราฟอัตราสำเร็จ/ตอบถูก |
| วิเคราะห์ภารกิจ | Viewer | กราฟทั้ง 7 แบบ + ตารางสรุปรายภารกิจ |
| ผู้เข้าร่วม | Researcher | ตาราง ค้นหา กรองวันที่ ส่งออก CSV · กดดูรายละเอียด/Timeline · บันทึก Consent |
| Session | Researcher | ทุก session พร้อมสถานะ ระยะเวลา หยุด/เล่นต่อ คำใบ้ การช่วยเหลือ |
| ส่งออกข้อมูล | Researcher | CSV / Excel · ผู้เข้าร่วม / Session / Mission / ทั้งหมด · ใช้ตัวกรองด้านบน |
| ผู้ดูแลระบบ | Admin | จัดการผู้ใช้และสิทธิ์ · ลบผู้เข้าร่วม · ลบข้อมูลหมดอายุ · ข้อมูลตัวอย่าง · Audit Log |

**ตัวกรอง "ข้อมูล"** — ค่าเริ่มต้นแสดง *ข้อมูลจริงเท่านั้น* ข้อมูลตัวอย่าง (Demo) แสดงเมื่อเลือกเองเท่านั้น และมีแถบเตือนสีเหลืองทุกครั้ง

### ข้อมูลตัวอย่าง (Demo)
ใช้ทดลองดูหน้าจอก่อนมีข้อมูลจริง: Admin → **ใส่ข้อมูลตัวอย่าง** (ผู้เข้าร่วม 14 คน) · ลบได้ด้วย **ลบข้อมูลตัวอย่าง**
ทุกแถวติด `is_demo = TRUE` และขึ้นป้าย DEMO — ไม่ปนกับข้อมูลจริงในการคำนวณโดยค่าเริ่มต้น

### ความหมายของตัวเลข
- **ตอบถูกในครั้งแรก** = คำตอบครั้งแรกของภารกิจที่ถูก ÷ จำนวนคำตอบครั้งแรกทั้งหมด (เกมให้ลองใหม่ได้จนถูก จึงใช้ครั้งแรกเป็นตัววัด)
- **อัตราทำภารกิจสำเร็จ** = จำนวน session ที่ตอบภารกิจนั้นถูก ÷ จำนวน session ที่เริ่มภารกิจนั้น
- **ตอบเอง / หลังใช้คำใบ้ / ผู้ดูแลช่วย** — แยกจากคำตอบครั้งแรก: ถ้าผู้ดูแลกดปุ่ม 🤝 ก่อนตอบ = ผู้ดูแลช่วย, ถ้าใช้คำใบ้ = หลังใช้คำใบ้, นอกนั้น = ตอบเอง
- **สถานะ Session**: เริ่มแล้ว (started) → กำลังเล่น (in_progress) → เล่นจบ (completed) / ออกกลางคัน (interrupted = กดพักแล้วกลับหน้าแรก) / ถูกละทิ้ง (abandoned = ไม่มีความเคลื่อนไหวเกิน 30 นาที)

## 5. ข้อมูลที่เกมส่ง

| เหตุการณ์ | เมื่อไร |
|---|---|
| participant + session | กด "เริ่มการผจญภัย" (รหัส `P-XXXXXXXX` สุ่ม ไม่เกี่ยวกับชื่อ) |
| mission_start | ภารกิจขึ้นบนจอ |
| answer | เลือก A/B — ถูก/ไม่ถูก, ครั้งที่, เวลาตอบ (ms), จำนวนคำใบ้, ผู้ดูแลช่วยหรือไม่ |
| hint | กด 💡 |
| assist | ผู้ดูแลกด 🤝 (บันทึกแยกในตาราง assistance_events) |
| pause / resume / exit | กดพัก / เล่นต่อ / กลับหน้าแรก |
| complete | เล่นจบ (completed) หรือออกกลางคัน (interrupted) |

ถ้าเน็ตหลุด ข้อมูลรอในเครื่อง (localStorage) แล้วส่งใหม่อัตโนมัติ — ส่งซ้ำได้โดยไม่เกิดข้อมูลซ้ำ (ใช้ `client_event_id`)

## 6. REST API

| Method | Path | สิทธิ์ |
|---|---|---|
| POST | `/api/participants` | เกม (จำกัด 300 ครั้ง/นาที/IP) |
| POST | `/api/sessions` | เกม |
| POST | `/api/events` | เกม (ครั้งละ ≤ 200 เหตุการณ์) |
| POST | `/api/sessions/:id/complete` | เกม |
| POST | `/api/auth/login` · `/api/auth/logout` · GET `/api/auth/me` | — (login จำกัด 10 ครั้ง/15 นาที) |
| GET | `/api/dashboard/overview` · `/missions` · `/analytics` | Viewer |
| GET | `/api/dashboard/participants` · `/participants/:id` · `/sessions` · `/mission-events` · `/export` | Researcher |
| POST | `/api/dashboard/participants/:id/consent` | Researcher |
| GET/POST/PATCH | `/api/admin/users` | Admin |
| DELETE | `/api/admin/participants/:id` | Admin |
| GET/POST | `/api/admin/retention` · `/retention/purge` · `/demo/seed` · `/demo/clear` · GET `/audit-logs` | Admin |

ตัวกรองที่ใช้ได้กับ GET ของ dashboard: `q` (Participant ID), `from`, `to` (YYYY-MM-DD), `demo` (`exclude`/`include`/`only`)
`/export` เพิ่ม: `dataset` (`participants`/`sessions`/`missions`/`all`), `format` (`csv`/`xlsx`)

## 7. ความปลอดภัยและจริยธรรม

| ข้อกำหนด | ทำอย่างไร |
|---|---|
| ใช้รหัสแทนตัวตน | Participant ID สุ่ม `P-XXXXXXXX` · ไม่มีช่องชื่อจริง/นามสกุล/เลขบัตร/เบอร์โทรในฐานข้อมูล |
| เก็บเท่าที่จำเป็น | ชื่อเล่นไม่บังคับ และ **ไม่ถูกส่งออก** · ไม่เก็บเสียง/วิดีโอ |
| รหัสผ่าน | bcrypt (cost 12) · session เป็น JWT ใน cookie httpOnly + SameSite=Strict อายุ 8 ชม. |
| สิทธิ์ | Admin / Researcher / Viewer ตรวจที่เซิร์ฟเวอร์ทุก API · Viewer ไม่เห็นข้อมูลรายบุคคล |
| SQL Injection | parameterized query ทุกคำสั่ง · ตรวจรูปแบบข้อมูลด้วย zod ก่อนบันทึก |
| CSV Injection | ค่าที่ขึ้นต้นด้วย `= + - @` ถูกใส่ `'` นำหน้าตอนส่งออก |
| Audit Log | เข้าสู่ระบบ (สำเร็จ/ไม่สำเร็จ), ดูข้อมูลรายบุคคล, ส่งออก, บันทึก consent, จัดการผู้ใช้, ลบข้อมูล |
| ระยะเวลาเก็บ | `RETENTION_DAYS` + ปุ่มลบข้อมูลหมดอายุ (Admin) · ลบรายบุคคลเมื่อถอนตัว |
| HTTPS | ต้องตั้ง reverse proxy ที่มี TLS ใน production (ดูข้อ 3) |
| Consent | บันทึกผู้ปกครองยินยอม / เด็ก assent / ถอนความยินยอม ต่อผู้เข้าร่วม (เก็บประวัติทุกครั้ง) |

## 8. สิ่งที่ยังไม่ได้ทำ / ข้อจำกัด

- เกมยังไม่มีหน้าเลือกโหมด Independent / Guided / Supported — ทุก session บันทึกเป็น `independent` ส่วนการช่วยเหลือจริงบันทึกจากปุ่ม 🤝
- เกมยังไม่มีปุ่ม "ข้ามภารกิจ" — ช่องภารกิจที่ข้ามจึงเป็น 0 เสมอ (ระบบรองรับไว้แล้ว)
- ยังไม่เชื่อม Consent กับการเริ่มเกม (เกมสร้าง participant เองตอนเริ่ม) — ถ้าต้องการให้เด็กเล่นได้เฉพาะเมื่อมี consent แล้ว ต้องเปลี่ยนเป็นให้ผู้วิจัยสร้างรหัสก่อนแล้วกรอกในเกม
- รหัสผู้เข้าร่วมสร้างใหม่ทุกครั้งที่กดเริ่มเกม — ถ้าต้องติดตามเด็กคนเดิมหลายรอบ ต้องให้ผู้วิจัยกรอกรหัสเดิม
- ESLint ใช้ไม่ได้ เพราะ typescript-eslint ยังไม่รองรับ TypeScript 7 ที่มากับโปรเจกต์ (ใช้ `npm run build` ตรวจชนิดข้อมูลแทน)
