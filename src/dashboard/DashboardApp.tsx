import { useEffect, useState, type FormEvent } from 'react'
import { BarChart3, Download, FileClock, LayoutDashboard, ListChecks, LogOut, Lock, ShieldCheck, Users } from 'lucide-react'
import { api, ApiError, type Filter, type Role, type User } from './api'
import { btnPrimary, input } from './ui'
import { AnalyticsPage, ExportPage, OverviewPage, ParticipantDetailPage, ParticipantsPage, SessionsPage } from './pages'
import { AdminPage } from './admin'

const RANK: Record<Role, number> = { viewer: 1, researcher: 2, admin: 3 }
export const can = (u: User, min: Role) => RANK[u.role] >= RANK[min]

const NAV: { path: string; label: string; icon: typeof Users; min: Role }[] = [
  { path: 'overview', label: 'ภาพรวม', icon: LayoutDashboard, min: 'viewer' },
  { path: 'analytics', label: 'วิเคราะห์ภารกิจ', icon: BarChart3, min: 'viewer' },
  { path: 'participants', label: 'ผู้เข้าร่วม', icon: Users, min: 'researcher' },
  { path: 'sessions', label: 'Session', icon: ListChecks, min: 'researcher' },
  { path: 'export', label: 'ส่งออกข้อมูล', icon: Download, min: 'researcher' },
  { path: 'admin', label: 'ผู้ดูแลระบบ', icon: ShieldCheck, min: 'admin' },
]
const ROLE_TH: Record<Role, string> = { admin: 'Admin', researcher: 'Researcher', viewer: 'Viewer' }

function useHashRoute() {
  const read = () => location.hash.replace(/^#\/?/, '') || 'overview'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => setRoute(read())
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return route
}
export const go = (path: string) => { location.hash = `/${path}` }

export default function DashboardApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => { api.me().then(r => setUser(r.user)).catch(() => setUser(null)) }, [])
  if (user === undefined) return <div className="grid h-full place-items-center text-muted">กำลังโหลด…</div>
  if (!user) return <Login onLogin={setUser} />
  return <Shell user={user} onLogout={() => setUser(null)} />
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { onLogin((await api.login(username, password)).user) } catch (x) { setErr(x instanceof Error ? x.message : 'เข้าสู่ระบบไม่สำเร็จ') } finally { setBusy(false) }
  }
  return (
    <main className="grid min-h-full place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-700"><Lock className="h-5 w-5" /></div>
          <div>
            <h1 className="text-lg font-semibold">Research Dashboard</h1>
            <p className="text-sm text-muted">Little Steps: The Guardian's Journey</p>
          </div>
        </div>
        <label className="mb-1 block text-sm font-medium" htmlFor="u">ชื่อผู้ใช้</label>
        <input id="u" className={`${input} mb-4 w-full`} value={username} onChange={e => setU(e.target.value)} autoComplete="username" required />
        <label className="mb-1 block text-sm font-medium" htmlFor="p">รหัสผ่าน</label>
        <input id="p" type="password" className={`${input} mb-4 w-full`} value={password} onChange={e => setP(e.target.value)} autoComplete="current-password" required />
        {err && <p className="mb-4 text-sm text-rose-700" role="alert">{err}</p>}
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button>
        <p className="mt-6 text-xs leading-relaxed text-muted">สำหรับผู้วิจัยที่ได้รับอนุญาตเท่านั้น ทุกการเข้าถึงข้อมูลถูกบันทึกใน Audit Log</p>
      </form>
    </main>
  )
}

function Shell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const route = useHashRoute()
  const [filter, setFilter] = useState<Filter>({ demo: 'exclude' })
  const [base, param] = route.split('/')
  const allowed = NAV.find(n => n.path === base) ?? NAV[0]
  const page = can(user, allowed.min) ? base : 'overview'

  // ถ้าเซสชันหมดอายุระหว่างใช้งาน ให้กลับไปหน้าเข้าสู่ระบบ
  useEffect(() => {
    const on = (e: PromiseRejectionEvent) => { if (e.reason instanceof ApiError && e.reason.status === 401) onLogout() }
    addEventListener('unhandledrejection', on)
    return () => removeEventListener('unhandledrejection', on)
  }, [onLogout])

  const logout = async () => { await api.logout().catch(() => {}); onLogout() }
  const showFilter = ['overview', 'analytics', 'participants', 'sessions', 'export'].includes(page) && !(page === 'participants' && param)

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="border-b border-line bg-white md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-5 py-4">
          <img src="/assets/ui/logo.png" alt="" className="h-9 w-auto" />
          <div className="text-sm font-semibold leading-tight">Little Steps<br /><span className="font-normal text-muted">Research</span></div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {NAV.filter(n => can(user, n.min)).map(n => {
            const active = page === n.path
            return (
              <a key={n.path} href={`#/${n.path}`} aria-current={active ? 'page' : undefined}
                className={`flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm ${active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink hover:bg-stone-50'}`}>
                <n.icon className="h-4 w-4" aria-hidden />{n.label}
              </a>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-5 py-3">
          <h1 className="text-lg font-semibold">{param && page === 'participants' ? `ผู้เข้าร่วม ${param}` : allowed.label}</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted"><FileClock className="mr-1 inline h-4 w-4" />{user.username} · {ROLE_TH[user.role]}</span>
            <button onClick={logout} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-muted hover:bg-stone-100"><LogOut className="h-4 w-4" /> ออกจากระบบ</button>
          </div>
        </header>

        {showFilter && <FilterBar filter={filter} setFilter={setFilter} showSearch={page !== 'overview' && page !== 'analytics'} />}

        <main className="flex-1 space-y-5 p-5">
          {page === 'overview' && <OverviewPage filter={filter} setFilter={setFilter} />}
          {page === 'analytics' && <AnalyticsPage filter={filter} />}
          {page === 'participants' && (param ? <ParticipantDetailPage id={param} user={user} /> : <ParticipantsPage filter={filter} user={user} />)}
          {page === 'sessions' && <SessionsPage filter={filter} />}
          {page === 'export' && <ExportPage filter={filter} />}
          {page === 'admin' && <AdminPage user={user} />}
        </main>
        <footer className="px-5 pb-5 text-xs text-muted">
          ผลการเล่นเป็นข้อมูลพฤติกรรมการเรียนรู้ในเกม ห้ามใช้วินิจฉัยโรคหรือประเมินความสามารถทางการแพทย์ของเด็ก
        </footer>
      </div>
    </div>
  )
}

function FilterBar({ filter, setFilter, showSearch }: { filter: Filter; setFilter: (f: Filter) => void; showSearch: boolean }) {
  const set = (k: keyof Filter, v: string) => setFilter({ ...filter, [k]: v || undefined })
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-line bg-white/60 px-5 py-3 text-sm">
      {showSearch && (
        <label className="flex flex-col gap-1"><span className="text-xs text-muted">ค้นหา Participant ID</span>
          <input className={input} placeholder="P-XXXXXXXX" value={filter.q ?? ''} maxLength={20} onChange={e => set('q', e.target.value.trim())} /></label>
      )}
      <label className="flex flex-col gap-1"><span className="text-xs text-muted">ตั้งแต่วันที่</span>
        <input type="date" className={input} value={filter.from ?? ''} onChange={e => set('from', e.target.value)} /></label>
      <label className="flex flex-col gap-1"><span className="text-xs text-muted">ถึงวันที่</span>
        <input type="date" className={input} value={filter.to ?? ''} onChange={e => set('to', e.target.value)} /></label>
      <label className="flex flex-col gap-1"><span className="text-xs text-muted">ข้อมูล</span>
        <select className={input} value={filter.demo} onChange={e => setFilter({ ...filter, demo: e.target.value as Filter['demo'] })}>
          <option value="exclude">ข้อมูลจริงเท่านั้น</option>
          <option value="include">ข้อมูลจริง + ตัวอย่าง</option>
          <option value="only">ข้อมูลตัวอย่างเท่านั้น</option>
        </select></label>
      {(filter.q || filter.from || filter.to) && (
        <button className="min-h-10 rounded-xl px-3 text-muted hover:bg-stone-100" onClick={() => setFilter({ demo: filter.demo })}>ล้างตัวกรอง</button>
      )}
    </div>
  )
}
