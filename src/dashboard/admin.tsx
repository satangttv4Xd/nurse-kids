import { useState, type FormEvent } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import { api, type Role, type User } from './api'
import { useLoad } from './pages'
import { Badge, btnGhost, btnPrimary, Card, Empty, fmtDate, input, Table } from './ui'

const ROLES: { v: Role; l: string; d: string }[] = [
  { v: 'admin', l: 'Admin', d: 'จัดการระบบและผู้ใช้งาน' },
  { v: 'researcher', l: 'Researcher', d: 'ดูข้อมูลรายบุคคล วิเคราะห์ ส่งออก บันทึก consent' },
  { v: 'viewer', l: 'Viewer', d: 'ดูรายงานภาพรวมเท่านั้น (ไม่เห็นข้อมูลรายบุคคล)' },
]

export function AdminPage({ user }: { user: User }) {
  return (
    <>
      <UsersCard me={user} />
      <div className="grid gap-5 xl:grid-cols-2">
        <DataPolicyCard />
        <DeleteParticipantCard />
      </div>
      <AuditCard />
    </>
  )
}

function UsersCard({ me }: { me: User }) {
  const { data, error, reload } = useLoad(() => api.users(), [])
  const [f, setF] = useState({ username: '', password: '', role: 'researcher' as Role })
  const [msg, setMsg] = useState('')
  const add = async (e: FormEvent) => {
    e.preventDefault()
    try { await api.createUser(f); setF({ username: '', password: '', role: 'researcher' }); setMsg('เพิ่มผู้ใช้แล้ว'); reload() } catch (x) { setMsg(x instanceof Error ? x.message : 'ไม่สำเร็จ') }
  }
  const update = async (id: number, b: Parameters<typeof api.updateUser>[1]) => {
    try { await api.updateUser(id, b); reload() } catch (x) { alert(x instanceof Error ? x.message : 'ไม่สำเร็จ') }
  }
  return (
    <Card title="ผู้ใช้งาน Dashboard">
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {data && (
        <Table head={['ชื่อผู้ใช้', 'สิทธิ์', 'สถานะ', 'เข้าสู่ระบบล่าสุด', '']}>
          {data.map(u => (
            <tr key={u.id}>
              <td className="px-3 py-2 font-medium">{u.username}{u.id === me.id && <span className="ml-1 text-xs text-muted">(คุณ)</span>}</td>
              <td className="px-3 py-2">
                <select className={input} value={u.role} disabled={u.id === me.id} onChange={e => update(u.id, { role: e.target.value as Role })}>
                  {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                </select>
              </td>
              <td className="px-3 py-2">{u.is_active ? <Badge kind="completed">ใช้งาน</Badge> : <Badge kind="abandoned">ปิดใช้งาน</Badge>}</td>
              <td className="px-3 py-2 text-muted">{fmtDate(u.last_login_at)}</td>
              <td className="px-3 py-2 text-right">
                {u.id !== me.id && <button className={btnGhost} onClick={() => update(u.id, { isActive: !u.is_active })}>{u.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</button>}
              </td>
            </tr>
          ))}
        </Table>
      )}
      <form onSubmit={add} className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-4 text-sm">
        <label className="flex flex-col gap-1"><span className="text-xs text-muted">ชื่อผู้ใช้ (a-z, 0-9)</span>
          <input className={input} value={f.username} onChange={e => setF({ ...f, username: e.target.value })} pattern="[a-zA-Z0-9._\-]{3,40}" required /></label>
        <label className="flex flex-col gap-1"><span className="text-xs text-muted">รหัสผ่าน (อย่างน้อย 10 ตัว)</span>
          <input type="password" className={input} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} minLength={10} required autoComplete="new-password" /></label>
        <label className="flex flex-col gap-1"><span className="text-xs text-muted">สิทธิ์</span>
          <select className={input} value={f.role} onChange={e => setF({ ...f, role: e.target.value as Role })}>{ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}</select></label>
        <button className={btnPrimary}><UserPlus className="h-4 w-4" /> เพิ่มผู้ใช้</button>
        {msg && <span className="text-muted">{msg}</span>}
      </form>
      <ul className="mt-4 space-y-1 text-xs text-muted">{ROLES.map(r => <li key={r.v}><b>{r.l}</b> — {r.d}</li>)}</ul>
    </Card>
  )
}

function DataPolicyCard() {
  const { data, reload } = useLoad(() => api.retention(), [])
  const [msg, setMsg] = useState('')
  const purge = async () => {
    if (!data || !confirm(`ลบผู้เข้าร่วม ${data.expiredParticipants} คนที่เกิน ${data.retentionDays} วัน พร้อมข้อมูลทั้งหมด? การลบย้อนกลับไม่ได้`)) return
    const r = await api.purge(); setMsg(`ลบแล้ว ${r.deleted} คน`); reload()
  }
  const seedDemo = async () => {
    if (!confirm('ใส่ข้อมูลตัวอย่าง (Demo) สำหรับทดลองระบบ? ข้อมูลจะถูกติดป้าย DEMO และไม่ปนกับข้อมูลจริงโดยค่าเริ่มต้น')) return
    const r = await api.seedDemo(); setMsg(`ใส่ข้อมูลตัวอย่างแล้ว ${r.participants} คน ${r.sessions} sessions — เลือก "ข้อมูลตัวอย่าง" ในตัวกรองเพื่อดู`)
  }
  const clearDemo = async () => {
    if (!confirm('ลบข้อมูลตัวอย่าง (Demo) ทั้งหมด?')) return
    const r = await api.clearDemo(); setMsg(`ลบข้อมูลตัวอย่างแล้ว ${r.deleted} คน`)
  }
  return (
    <Card title="นโยบายเก็บรักษาข้อมูล">
      {data && <p className="mb-4 text-sm">ระยะเวลาเก็บรักษา: <b>{data.retentionDays} วัน</b> (ตั้งค่าที่ RETENTION_DAYS) · เกินกำหนดแล้ว <b>{data.expiredParticipants}</b> คน</p>}
      <div className="flex flex-wrap gap-3">
        <button className={btnGhost} onClick={purge} disabled={!data?.expiredParticipants}><Trash2 className="h-4 w-4" /> ลบข้อมูลที่หมดอายุ</button>
        <button className={btnGhost} onClick={seedDemo}>ใส่ข้อมูลตัวอย่าง</button>
        <button className={btnGhost} onClick={clearDemo}><Trash2 className="h-4 w-4" /> ลบข้อมูลตัวอย่าง</button>
      </div>
      {msg && <p className="mt-3 text-sm text-muted">{msg}</p>}
    </Card>
  )
}

function DeleteParticipantCard() {
  const [id, setId] = useState('')
  const [msg, setMsg] = useState('')
  const del = async (e: FormEvent) => {
    e.preventDefault()
    if (!confirm(`ลบ ${id} และข้อมูลการเล่นทั้งหมด? การลบย้อนกลับไม่ได้`)) return
    try { await api.deleteParticipant(id); setMsg(`ลบ ${id} แล้ว`); setId('') } catch (x) { setMsg(x instanceof Error ? x.message : 'ไม่สำเร็จ') }
  }
  return (
    <Card title="ลบข้อมูลผู้เข้าร่วม">
      <p className="mb-3 text-sm text-muted">ใช้เมื่อผู้ปกครองขอถอนตัว/ลบข้อมูล ตามนโยบายโครงการ</p>
      <form onSubmit={del} className="flex flex-wrap gap-3">
        <input className={input} placeholder="P-XXXXXXXX" value={id} onChange={e => setId(e.target.value.trim().toUpperCase())} pattern="P-[0-9A-F]{8}" required />
        <button className={btnGhost}><Trash2 className="h-4 w-4" /> ลบ</button>
      </form>
      {msg && <p className="mt-3 text-sm text-muted">{msg}</p>}
    </Card>
  )
}

const ACTION_TH: Record<string, string> = {
  login: 'เข้าสู่ระบบ', logout: 'ออกจากระบบ', login_failed: 'เข้าสู่ระบบไม่สำเร็จ', view_participant: 'ดูข้อมูลผู้เข้าร่วม',
  export: 'ส่งออกข้อมูล', record_consent: 'บันทึก consent', create_user: 'เพิ่มผู้ใช้', update_user: 'แก้ไขผู้ใช้',
  delete_participant: 'ลบผู้เข้าร่วม', retention_purge: 'ลบข้อมูลหมดอายุ', demo_clear: 'ลบข้อมูลตัวอย่าง', demo_seed: 'ใส่ข้อมูลตัวอย่าง',
}

function AuditCard() {
  const { data } = useLoad(() => api.auditLogs(), [])
  return (
    <Card title="Audit Log (500 รายการล่าสุด)">
      {!data ? null : !data.length ? <Empty /> : (
        <div className="max-h-96 overflow-y-auto">
          <Table head={['เวลา', 'ผู้ใช้', 'การกระทำ', 'เป้าหมาย', 'รายละเอียด']}>
            {data.map(a => (
              <tr key={a.id}>
                <td className="whitespace-nowrap px-3 py-1.5 text-muted">{fmtDate(a.created_at)}</td>
                <td className="px-3 py-1.5">{a.username ?? '—'}</td>
                <td className="px-3 py-1.5">{ACTION_TH[a.action] ?? a.action}</td>
                <td className="px-3 py-1.5 font-mono text-xs">{a.target ?? ''}</td>
                <td className="max-w-xs truncate px-3 py-1.5 font-mono text-xs text-muted">{a.detail ? JSON.stringify(a.detail) : ''}</td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </Card>
  )
}
