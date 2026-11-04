import type { ReactNode } from 'react'
import { AlertTriangle, Inbox } from 'lucide-react'

export const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
export const fmtDay = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString('th-TH', { dateStyle: 'medium' }) : '—')
export const fmtDuration = (sec: number | null | undefined) => {
  if (sec == null) return '—'
  const m = Math.floor(sec / 60), s = Math.round(sec % 60)
  return m ? `${m} นาที ${s} วิ` : `${s} วิ`
}
export const fmtPct = (v: number | null | undefined) => (v == null ? '—' : `${v}%`)

export const STATUS_TH: Record<string, string> = {
  started: 'เริ่มแล้ว', in_progress: 'กำลังเล่น', completed: 'เล่นจบ', interrupted: 'ออกกลางคัน', abandoned: 'ถูกละทิ้ง',
}
export const CONSENT_TH: Record<string, string> = {
  none: 'ยังไม่บันทึก', partial: 'ยังไม่ครบ', consented: 'ยินยอมครบ', withdrawn: 'ถอนความยินยอม',
}
export const ASSIST_TH: Record<string, string> = { independent: 'ตอบเอง', after_hint: 'หลังใช้คำใบ้', caregiver: 'ผู้ดูแลช่วย' }

export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted">{icon}<span>{label}</span></div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  )
}

export function Empty({ title = 'ยังไม่มีข้อมูล', children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted">
      <Inbox className="h-10 w-10 opacity-50" aria-hidden />
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="max-w-md text-sm">{children}</div>}
    </div>
  )
}

export function DemoBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="note">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span><b>กำลังแสดงข้อมูลตัวอย่าง (Demo)</b> — ข้อมูลนี้สร้างขึ้นเพื่อทดลองระบบ ไม่ใช่ข้อมูลของผู้เข้าร่วมจริง ห้ามนำไปใช้ในการวิเคราะห์ผลวิจัย</span>
    </div>
  )
}

const BADGE: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200', consented: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  in_progress: 'bg-sky-50 text-sky-800 ring-sky-200', started: 'bg-sky-50 text-sky-800 ring-sky-200',
  interrupted: 'bg-amber-50 text-amber-800 ring-amber-200', partial: 'bg-amber-50 text-amber-800 ring-amber-200',
  abandoned: 'bg-stone-100 text-stone-700 ring-stone-300', none: 'bg-stone-100 text-stone-700 ring-stone-300',
  withdrawn: 'bg-rose-50 text-rose-800 ring-rose-200',
}
export function Badge({ kind, children }: { kind: string; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE[kind] ?? BADGE.none}`}>{children}</span>
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
          <tr>{head.map((h, i) => <th key={i} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  )
}

export const btn = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50'
export const btnPrimary = `${btn} bg-brand-600 text-white hover:bg-brand-700`
export const btnGhost = `${btn} border border-line bg-white text-ink hover:bg-stone-50`
export const input = 'min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100'
