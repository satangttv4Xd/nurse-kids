// ส่งออกข้อมูลเป็น CSV (UTF-8 + BOM ให้ Excel อ่านภาษาไทยได้) หรือ Excel (.xlsx)
import ExcelJS from 'exceljs'
import type { Row } from '../db.ts'

/** กัน CSV/Formula injection: ค่าที่ขึ้นต้นด้วย = + - @ จะถูกใส่ ' นำหน้า */
const safe = (v: unknown): string | number | boolean => {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'number' || typeof v === 'boolean') return v
  const s = String(v)
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

export function toCsv(rows: Row[]): string {
  if (!rows.length) return '﻿'
  const cols = Object.keys(rows[0])
  const esc = (v: unknown) => {
    const s = String(safe(v))
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\r\n')
}

export async function toXlsx(sheets: Record<string, Row[]>): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Little Steps Research Dashboard'
  wb.created = new Date()
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = wb.addWorksheet(name)
    const cols = rows.length ? Object.keys(rows[0]) : ['(ไม่มีข้อมูล)']
    ws.columns = cols.map(c => ({ header: c, key: c, width: Math.max(12, c.length + 2) }))
    ws.getRow(1).font = { bold: true }
    for (const r of rows) ws.addRow(Object.fromEntries(cols.map(c => [c, safe(r[c])])))
  }
  return Buffer.from(await wb.xlsx.writeBuffer())
}
