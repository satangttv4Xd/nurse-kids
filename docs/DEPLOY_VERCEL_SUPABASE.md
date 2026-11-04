# Deploy บน Vercel + Supabase

```
ผู้เล่น / ผู้วิจัย ──HTTPS──▶ Vercel
                              ├─ CDN: เกม (/) และ Dashboard (/dashboard)
                              └─ Function /api/*  (Express เดิม)
                                       │  SSL + ตรวจใบรับรอง
                                       ▼
                              Supabase PostgreSQL (Transaction pooler :6543)
```

- **Supabase** ใช้เป็นฐานข้อมูล PostgreSQL อย่างเดียว ไม่ใช้ Supabase Auth หรือ supabase-js
- **ระบบเข้าสู่ระบบ** ยังเป็นของเราเอง (bcrypt + JWT cookie)
- **โค้ดเดียวกัน** ใช้ได้ทั้งในเครื่อง (`npm run dev`) และบน Vercel

> ⚠️ **ก่อนเก็บข้อมูลจริง:** ข้อมูลจะถูกเก็บบนเซิร์ฟเวอร์ของ Supabase และ Vercel ซึ่งอยู่นอกประเทศไทย
> - ต้องระบุสถานที่เก็บข้อมูลไว้ในโครงร่างวิจัย และได้รับอนุมัติจากคณะกรรมการจริยธรรม
> - ต้องพิจารณาเรื่องการโอนข้อมูลไปต่างประเทศตาม PDPA
> - จนกว่าจะได้รับอนุมัติ ให้ตั้ง `COLLECTION_ENABLED=false`

---

## 1. Supabase — สร้างฐานข้อมูล

1. สมัครหรือเข้าสู่ระบบที่ https://supabase.com แล้วกด **New project**
   - **Region:** เลือก **Southeast Asia (Singapore)** เพราะใกล้ผู้ใช้ที่สุด
   - **Database password:** สุ่มให้ยาว แล้วจดไว้ในที่ปลอดภัย
2. **Connection string:** กดปุ่ม **Connect** ด้านบนของโปรเจกต์ แล้วเลือก **Transaction pooler** (พอร์ต **6543**)
   - คัดลอก URI จะได้ประมาณนี้:
     ```
     postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
     ```
   - แทน `[YOUR-PASSWORD]` ด้วยรหัสผ่านจริง ถ้ารหัสผ่านมีอักขระพิเศษ เช่น `@ # / ?` ต้อง URL-encode ก่อน (เช่น `@` → `%40`)
   - ใช้ Transaction pooler เพราะ Vercel เปิด function หลายตัวพร้อมกัน ถ้าต่อตรงที่พอร์ต 5432 connection จะเต็ม
3. **ใบรับรอง SSL:** ไปที่ **Project Settings → Database → SSL Configuration** แล้วกด **Download certificate**
   - จะได้ไฟล์ `prod-ca-2021.crt` (หรือชื่อใกล้เคียง)
   - เปิดด้วย Notepad แล้วคัดลอกทั้งไฟล์ ตั้งแต่ `-----BEGIN CERTIFICATE-----` ถึง `-----END CERTIFICATE-----`
   - ระบบบังคับตรวจใบรับรองทุกครั้ง ถ้าไม่ตั้งค่านี้จะเชื่อมต่อ Supabase ไม่ได้
4. **SSL Enforcement:** ในหน้าเดียวกัน เปิด **Enforce SSL on incoming connections** (แนะนำ)
5. **ตาราง:** ไม่ต้องสร้างเอง
   - API จะรัน `database/schema.sql` ให้อัตโนมัติตอนเริ่มทำงาน (คำสั่งเป็นแบบ `IF NOT EXISTS` รันซ้ำได้)
   - ถ้าต้องการสร้างล่วงหน้า วางเนื้อหา `database/schema.sql` ใน **SQL Editor** แล้วกด Run

### เรื่องความปลอดภัยของ Supabase
- `schema.sql` **เปิด Row Level Security ทุกตารางโดยไม่มี policy** ทำให้ anon key หรือ authenticated key ของ Supabase อ่านหรือเขียนข้อมูลผ่าน Data API ไม่ได้ มีแต่ API server ของเรา (ต่อด้วย user `postgres`) ที่เข้าถึงข้อมูลได้
- ถ้าไม่ใช้ Data API เลย ปิดเพิ่มได้ที่ **Project Settings → Data API**
- **ห้าม**ใส่ connection string หรือ service_role key ในโค้ดฝั่งเกมหรือ dashboard เด็ดขาด ตั้งไว้ใน Vercel Environment Variables เท่านั้น
- **Backup:** ตรวจสอบเงื่อนไขของแพ็กเกจที่ใช้ แพ็กเกจฟรีมีข้อจำกัดเรื่อง backup และโปรเจกต์จะถูกพักเมื่อไม่มีการใช้งานนาน ข้อมูลวิจัยจริงควรใช้แพ็กเกจที่มี backup อัตโนมัติ

---

## 2. Vercel — deploy เว็บ + API

### วิธี A: ผ่าน GitHub (แนะนำ เพราะ push แล้ว deploy ให้อัตโนมัติ)
1. push โปรเจกต์ขึ้น GitHub
   - `.gitignore` กันไฟล์เหล่านี้ไว้แล้ว: `.env`, `database/data`, `.vercel`
   - ⚠️ โฟลเดอร์ `ตัวละคร/`, `ฉาก/`, `m01`–`m08` คือรูปต้นฉบับขนาดใหญ่ เกมใช้รูปที่ย่อแล้วใน `public/assets/` อยู่แล้ว จะไม่ push โฟลเดอร์ต้นฉบับก็ได้
2. ที่ https://vercel.com กด **Add New → Project** แล้วเลือก repo
3. **Framework Preset:** เลือก **Other**
   - Build Command และ Install Command อ่านจาก `vercel.json` ให้แล้ว ไม่ต้องแก้
4. ใส่ **Environment Variables** ตามหัวข้อ 3 ด้านล่าง แล้วกด **Deploy**

### วิธี B: ผ่าน CLI (ไม่ต้องใช้ GitHub)
```bash
npx vercel login
npx vercel link            # สร้าง/เชื่อมโปรเจกต์บน Vercel
npx vercel env add DATABASE_URL production   # ทำซ้ำสำหรับทุกตัวแปรในหัวข้อ 3
npx vercel deploy --prod
```

### หลัง deploy ครั้งแรก
- **Settings → Functions → Function Region:** เลือก **Singapore (sin1)** ให้อยู่ที่เดียวกับ Supabase จะได้ตอบสนองเร็วขึ้นมาก จากนั้นกด Redeploy
- เปิด `https://<ชื่อโปรเจกต์>.vercel.app/api/health` ต้องเห็น `{"ok":true,...}`
- เปิด `https://<ชื่อโปรเจกต์>.vercel.app/admin` แล้วเข้าสู่ระบบด้วย `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- เมื่อเข้าได้แล้ว ให้สร้างบัญชีผู้วิจัยแยกในหน้า "ผู้ดูแลระบบ" ส่วน `ADMIN_PASSWORD` ใน Vercel ใช้ตอนสร้างบัญชีแรกเท่านั้น จะลบออกภายหลังก็ได้

---

## 3. Environment Variables (Vercel → Settings → Environment Variables)

| ตัวแปร | ค่า | จำเป็น |
|---|---|---|
| `DATABASE_URL` | URI ของ Transaction pooler จากข้อ 1.2 | ✅ |
| `DATABASE_CA_CERT` | เนื้อหาไฟล์ใบรับรองจากข้อ 1.3 ทั้งไฟล์ วางหลายบรรทัดได้ | ✅ |
| `JWT_SECRET` | สตริงสุ่มอย่างน้อย 32 ตัว เช่น ผลจาก `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` | ✅ |
| `ADMIN_USERNAME` | ชื่อบัญชีผู้ดูแลคนแรก | ✅ ครั้งแรก |
| `ADMIN_PASSWORD` | รหัสผ่านยาว ≥ 10 ตัว | ✅ ครั้งแรก |
| `COLLECTION_ENABLED` | `false` จนกว่าจะได้รับอนุมัติจริยธรรม แล้วค่อยเปลี่ยนเป็น `true` | แนะนำ |
| `RETENTION_DAYS` | ระยะเวลาเก็บข้อมูลตามโครงการ (ค่าเริ่มต้น 1825 วัน) | – |
| `ABANDON_AFTER_MINUTES` | ค่าเริ่มต้น 30 | – |

ระบบรู้เองว่ากำลังทำงานบน Vercel จากตัวแปร `VERCEL` ที่ Vercel ตั้งให้ จะเปิดโหมด production อัตโนมัติ คือ cookie แบบ `Secure` และบังคับให้มี `JWT_SECRET`

---

## 4. ทดลองในเครื่องโดยต่อกับ Supabase (ไม่บังคับ)

สร้างไฟล์ `.env` (ไฟล์นี้ไม่ถูก commit)
```
DATABASE_URL=postgresql://postgres.xxxx:รหัสผ่าน@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DATABASE_CA_CERT="-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----"
```
ในไฟล์ `.env` ต้องเขียนใบรับรองให้อยู่บรรทัดเดียว แล้วใช้ `\n` แทนการขึ้นบรรทัดใหม่ จากนั้นรัน `npm run dev` ตามปกติ

---

## 5. สิ่งที่เปลี่ยนในโค้ดเพื่อรองรับ Vercel

| ไฟล์ | ทำอะไร |
|---|---|
| `server/app.ts` | Express app เดิม แยกออกมาให้ทั้ง server ปกติและ Vercel ใช้ร่วมกัน เชื่อมฐานข้อมูลเมื่อมีคำขอแรก |
| `server/index.ts` | เหลือแค่ `listen()` สำหรับรันในเครื่อง หรือบนเซิร์ฟเวอร์ปกติ |
| `server/vercel.ts` | จุดเข้าของ Vercel Function |
| `server/db.ts` | SSL พร้อมตรวจใบรับรองเมื่อต่อฐานข้อมูลนอกเครื่อง, pool ขนาดเล็กบน serverless, หา schema.sql ใน bundle |
| `scripts/build-vercel.mjs` | สร้าง `.vercel/output` (Build Output API v3): ไฟล์เว็บ, function ที่ bundle แล้ว, เส้นทาง และ security headers |
| `vercel.json` | คำสั่ง install/build (`--legacy-peer-deps` เพราะ TypeScript 7 ชนกับ typescript-eslint) |
| `database/schema.sql` | เปิด Row Level Security ทุกตาราง |

ทดสอบ bundle จริงในเครื่องแล้ว ทั้งโหมด production ด้วย PGlite และรันนอกโฟลเดอร์โปรเจกต์ (ไม่มี node_modules) ผลคือ เข้าสู่ระบบได้, cookie เป็น Secure/HttpOnly, เกมส่งข้อมูลได้, export Excel ได้, ไม่ล็อกอินได้ 401

---

## 6. ข้อจำกัดบน Vercel

- **Rate limit** (กันเดารหัสผ่าน 10 ครั้ง / 15 นาที) นับแยกต่อ function instance ไม่ได้นับรวมทั้งระบบ จึงหละหลวมกว่าบนเซิร์ฟเวอร์เดียว ถ้าต้องการเข้มขึ้น เปิด **Vercel Firewall → Rate Limiting** เพิ่ม หรือใช้รหัสผ่านที่ยาวและเดายาก
- **คำขอแรกหลัง function ว่างนาน** (cold start) จะช้า 1–3 วินาที เกมมี outbox ส่งซ้ำอัตโนมัติอยู่แล้ว ข้อมูลจึงไม่หาย
- **ข้อมูลใน PGlite บนเครื่องนี้ไม่ถูกย้ายไป Supabase** บน Supabase จะเริ่มจากฐานข้อมูลว่าง ถ้าต้องการข้อมูลตัวอย่าง กดปุ่ม "ใส่ข้อมูลตัวอย่าง" ในหน้าผู้ดูแลระบบ
