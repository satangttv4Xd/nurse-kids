import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, CircleDashed, Clock, Download, Flag, Gauge, HandHelping, Lightbulb, LogOut, Pause, Play, Target, Trash2, Users, XCircle } from 'lucide-react'
import { api, type Analytics, type Filter, type Overview, type ParticipantDetail, type ParticipantRow, type SessionRow, type TimelineEvent, type User } from './api'
import { BarChart } from './charts'
import { can, go } from './DashboardApp'
import { ASSIST_TH, Badge, btnGhost, btnPrimary, Card, CONSENT_TH, DemoBanner, Empty, fmtDate, fmtDay, fmtDuration, fmtPct, input, StatCard, STATUS_TH, Table } from './ui'

export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, set] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)
  const reload = useCallback(() => {
    set(s => ({ ...s, loading: true }))
    run().then(data => set({ data, loading: false })).catch(e => set({ error: e.message, loading: false }))
  }, [run])
  useEffect(reload, [reload])
  return { ...state, reload }
}

const Loading = () => <div className="py-10 text-center text-sm text-muted">กำลังโหลด…</div>
const ErrorBox = ({ msg }: { msg: string }) => <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{msg}</div>

/* ================= ภาพรวม ================= */

export function OverviewPage({ filter, setFilter }: { filter: Filter; setFilter: (f: Filter) => void }) {
  const ov = useLoad(() => api.overview(filter), [JSON.stringify(filter)])
  const an = useLoad(() => api.analytics(filter), [JSON.stringify(filter)])
  if (ov.error) return <ErrorBox msg={ov.error} />
  if (!ov.data || !an.data) return <Loading />
  const o: Overview = ov.data
  return (
    <>
      {filter.demo !== 'exclude' && <DemoBanner />}
      {o.sessions === 0 && (
        <Card>
          <Empty title="ยังไม่มีข้อมูลการเล่น">
            ข้อมูลจะปรากฏเมื่อเด็กเริ่มเล่นเกมในเครื่องที่เชื่อมต่อกับเซิร์ฟเวอร์นี้
            {o.hasDemoData && filter.demo === 'exclude' && (
              <button className={`${btnGhost} mt-4`} onClick={() => setFilter({ ...filter, demo: 'only' })}>ดูข้อมูลตัวอย่าง (Demo)</button>
            )}
          </Empty>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={<Users className="h-4 w-4" />} label="ผู้เข้าร่วมทั้งหมด" value={o.participantsRegistered} hint={`เล่นในช่วงที่เลือก ${o.participants} คน`} />
        <StatCard icon={<Play className="h-4 w-4" />} label="Session ทั้งหมด" value={o.sessions} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="เล่นจบ" value={o.completed} />
        <StatCard icon={<CircleDashed className="h-4 w-4" />} label="ยังไม่จบ" value={o.notCompleted} hint="กำลังเล่น / ออกกลางคัน / ถูกละทิ้ง" />
        <StatCard icon={<Flag className="h-4 w-4" />} label="ภารกิจที่ทำสำเร็จ" value={o.missionsCompleted} hint="นับต่อ session ต่อภารกิจ" />
        <StatCard icon={<Target className="h-4 w-4" />} label="ตอบถูกในครั้งแรก" value={fmtPct(o.firstAttemptCorrectRate)} hint="ของคำตอบครั้งแรกทุกภารกิจ" />
      </div>
      {o.sessions > 0 && <CoreCharts a={an.data} />}
    </>
  )
}

function CoreCharts({ a }: { a: Analytics }) {
  const labels = a.missions.map(m => m.id)
  const none = a.missions.every(m => m.started === 0)
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <BarChart title="อัตราการทำภารกิจสำเร็จ" subtitle={`ภาพรวม ${fmtPct(a.overallMissionCompletionRate)} · ทำสำเร็จ ÷ เริ่มภารกิจ`}
        labels={labels} series={[{ label: 'ทำสำเร็จ', data: a.missions.map(m => m.completionRate) }]} unit="%" max={100} empty={none} />
      <BarChart title="อัตราการตอบถูกในครั้งแรก รายภารกิจ" subtitle="ตอบถูกครั้งแรก ÷ จำนวนครั้งที่ตอบครั้งแรก"
        labels={labels} series={[{ label: 'ตอบถูกครั้งแรก', data: a.missions.map(m => m.firstAttemptCorrectRate) }]} unit="%" max={100} empty={none} />
    </div>
  )
}

/* ================= วิเคราะห์ภารกิจ ================= */

const CORRECT: Record<string, 'A' | 'B'> = { M01: 'A', M02: 'B', M03: 'A', M04: 'B', M05: 'A', M06: 'B', M07: 'A', M08: 'A' }

export function AnalyticsPage({ filter }: { filter: Filter }) {
  const { data: a, error } = useLoad(() => api.analytics(filter), [JSON.stringify(filter)])
  if (error) return <ErrorBox msg={error} />
  if (!a) return <Loading />
  const labels = a.missions.map(m => m.id)
  const none = a.missions.every(m => m.started === 0)
  const durations = a.sessionDurations
  const assistNone = a.assistance.every(x => x.total === 0)
  return (
    <>
      {filter.demo !== 'exclude' && <DemoBanner />}
      <CoreCharts a={a} />
      <div className="grid gap-5 xl:grid-cols-2">
        <BarChart title="ผลการตอบ M01–M08" subtitle="จำนวน session: ถูกตั้งแต่ครั้งแรก เทียบกับต้องลองใหม่ก่อนถูก" stacked
          labels={labels} empty={none}
          series={[
            { label: 'ถูกครั้งแรก', data: a.missions.map(m => m.firstCorrect) },
            { label: 'ลองใหม่แล้วถูก', data: a.missions.map(m => Math.max(0, m.completed - m.firstCorrect)) },
          ]} />
        <BarChart title="การเลือกตัวเลือก A / B" subtitle={`คำตอบที่เหมาะสม: ${labels.map(l => `${l}=${CORRECT[l]}`).join(' · ')}`}
          labels={labels} empty={none}
          series={[{ label: 'เลือก A', data: a.missions.map(m => m.choiceA) }, { label: 'เลือก B', data: a.missions.map(m => m.choiceB) }]} />
        <BarChart title="การใช้คำใบ้ รายภารกิจ" subtitle="จำนวนครั้งที่กดคำใบ้" labels={labels} empty={none}
          series={[{ label: 'ใช้คำใบ้', data: a.missions.map(m => m.hints) }]} />
        <BarChart title="ตอบเอง vs. ได้รับความช่วยเหลือ" subtitle="อัตราการตอบถูกในครั้งแรก แยกตามการช่วยเหลือ (n = จำนวนคำตอบ)" empty={assistNone}
          labels={a.assistance.map(x => `${ASSIST_TH[x.kind]} (n=${x.total})`)} unit="%" max={100}
          series={[{ label: 'ตอบถูกครั้งแรก', data: a.assistance.map(x => x.correctRate) }]} />
      </div>
      <BarChart title="ระยะเวลาเล่นแต่ละ Session" subtitle={`${durations.length} session ล่าสุด เรียงตามเวลาเริ่ม (นาที)`} height={300}
        labels={durations.map(d => `${d.participantId} · ${fmtDay(d.startedAt)}`)} empty={!durations.length}
        series={[{ label: 'นาที', data: durations.map(d => Math.round(d.durationSec / 6) / 10) }]} />
      <Card title="สรุปรายภารกิจ">
        <Table head={['ภารกิจ', 'ด่าน', 'เริ่ม', 'สำเร็จ', 'ถูกครั้งแรก', 'A', 'B', 'คำใบ้', 'ข้าม', 'เวลาเฉลี่ยจนตอบถูก']}>
          {a.missions.map(m => (
            <tr key={m.id}>
              <td className="px-3 py-2"><b>{m.id}</b> {m.title}</td><td className="px-3 py-2 text-muted">{m.area}</td>
              <td className="px-3 py-2 tabular-nums">{m.started}</td><td className="px-3 py-2 tabular-nums">{m.completed}</td>
              <td className="px-3 py-2 tabular-nums">{fmtPct(m.firstAttemptCorrectRate)}</td>
              <td className="px-3 py-2 tabular-nums">{m.choiceA}</td><td className="px-3 py-2 tabular-nums">{m.choiceB}</td>
              <td className="px-3 py-2 tabular-nums">{m.hints}</td><td className="px-3 py-2 tabular-nums">{m.skipped}</td>
              <td className="px-3 py-2 tabular-nums">{m.avgSecondsToCorrect == null ? '—' : `${m.avgSecondsToCorrect} วิ`}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  )
}

/* ================= ผู้เข้าร่วม ================= */

/** ลบผู้เข้าร่วมและข้อมูลการเล่นทั้งหมด (เฉพาะ Admin) — คืนค่า true เมื่อลบสำเร็จ */
async function confirmDelete(p: { participant_id: string; nickname?: string | null }) {
  const who = p.nickname ? `${p.participant_id} (${p.nickname})` : p.participant_id
  if (!confirm(`ลบ ${who} พร้อมข้อมูลการเล่นทั้งหมด?

การลบย้อนกลับไม่ได้`)) return false
  try { await api.deleteParticipant(p.participant_id); return true }
  catch (e) { alert(e instanceof Error ? e.message : 'ลบไม่สำเร็จ'); return false }
}

export function ParticipantsPage({ filter, user }: { filter: Filter; user: User }) {
  const { data, error, reload } = useLoad(() => api.participants(filter), [JSON.stringify(filter)])
  const isAdmin = can(user, 'admin')
  if (error) return <ErrorBox msg={error} />
  if (!data) return <Loading />
  return (
    <>
      {filter.demo !== 'exclude' && <DemoBanner />}
      <Card title={`ผู้เข้าร่วม ${data.length} คน`} action={
        <a className={btnGhost} href={api.exportUrl({ ...filter, dataset: 'participants', format: 'csv' })}><Download className="h-4 w-4" /> ส่งออก CSV</a>
      }>
        {!data.length ? <Empty>ยังไม่มีผู้เข้าร่วมที่ตรงกับตัวกรอง</Empty> : (
          <Table head={['Participant ID', 'ชื่อเล่นในเกม', 'วันที่เข้าร่วม', 'Session', 'สถานะการเล่น', 'Consent', '']}>
            {data.map((p: ParticipantRow) => (
              <tr key={p.participant_id} className="hover:bg-stone-50">
                <td className="px-3 py-2 font-mono font-medium">{p.participant_id}{p.is_demo && <span className="ml-2 rounded bg-amber-100 px-1.5 text-[10px] text-amber-900">DEMO</span>}</td>
                <td className="px-3 py-2 text-muted">{p.nickname ?? '—'}</td>
                <td className="px-3 py-2">{fmtDay(p.created_at)}</td>
                <td className="px-3 py-2 tabular-nums">{p.session_count}</td>
                <td className="px-3 py-2">{p.session_count === 0 ? <Badge kind="none">ยังไม่เล่น</Badge> : p.ever_completed ? <Badge kind="completed">เคยเล่นจบ</Badge> : <Badge kind="in_progress">ยังไม่จบ</Badge>}</td>
                <td className="px-3 py-2"><Badge kind={p.consent_status}>{CONSENT_TH[p.consent_status]}</Badge></td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <a className="text-brand-700 hover:underline" href={`#/participants/${p.participant_id}`}>ดูรายละเอียด</a>
                  {isAdmin && (
                    <button className="ml-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-rose-700 hover:bg-rose-50"
                      onClick={async () => { if (await confirmDelete(p)) reload() }} aria-label={`ลบ ${p.participant_id}`}>
                      <Trash2 className="h-4 w-4" /> ลบ
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}

/* ================= รายละเอียดผู้เข้าร่วม ================= */

const EVENT_TH: Record<string, { label: string; icon: typeof Play }> = {
  mission_start: { label: 'เริ่มภารกิจ', icon: Flag }, answer: { label: 'ตอบ', icon: Target }, hint: { label: 'ใช้คำใบ้', icon: Lightbulb },
  assist: { label: 'ผู้ดูแลช่วย', icon: HandHelping }, pause: { label: 'หยุดพัก', icon: Pause }, resume: { label: 'เล่นต่อ', icon: Play },
  exit: { label: 'ออกจากเกม', icon: LogOut }, mission_skip: { label: 'ข้ามภารกิจ', icon: XCircle },
}

export function ParticipantDetailPage({ id, user }: { id: string; user: User }) {
  const { data, error, reload } = useLoad(() => api.participant(id), [id])
  if (error) return <ErrorBox msg={error} />
  if (!data) return <Loading />
  const d: ParticipantDetail = data
  const hints = d.missions.reduce((a, m) => a + m.hints, 0)
  const assists = d.missions.reduce((a, m) => a + m.assists, 0)
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button className={btnGhost} onClick={() => go('participants')}><ArrowLeft className="h-4 w-4" /> กลับรายชื่อ</button>
        {can(user, 'admin') && (
          <button className={`${btnGhost} text-rose-700 hover:bg-rose-50`}
            onClick={async () => { if (await confirmDelete(d.participant)) go('participants') }}>
            <Trash2 className="h-4 w-4" /> ลบผู้เข้าร่วมนี้
          </button>
        )}
      </div>
      {d.participant.is_demo && <DemoBanner />}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={<Users className="h-4 w-4" />} label="Participant ID" value={<span className="font-mono text-2xl">{d.participant.participant_id}</span>} hint={`เข้าร่วม ${fmtDay(d.participant.created_at)}`} />
        <StatCard icon={<Play className="h-4 w-4" />} label="จำนวน Session" value={d.sessions.length} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="ภารกิจที่สำเร็จ" value={`${d.missions.filter(m => m.completed).length}/8`} />
        <StatCard icon={<Lightbulb className="h-4 w-4" />} label="ใช้คำใบ้" value={hints} hint="ครั้ง" />
        <StatCard icon={<HandHelping className="h-4 w-4" />} label="ผู้ดูแลช่วย" value={assists} hint="ครั้ง" />
      </div>

      <Card title="ผลรายภารกิจ">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {d.missions.map(m => (
            <div key={m.id} className={`rounded-xl border p-3 ${m.completed ? 'border-emerald-200 bg-emerald-50/40' : 'border-line'}`}>
              <div className="flex items-center justify-between">
                <b>{m.id}</b>{m.completed ? <Badge kind="completed">สำเร็จ</Badge> : <Badge kind="none">ยังไม่สำเร็จ</Badge>}
              </div>
              <p className="mb-2 text-sm text-muted">{m.title}</p>
              {m.answers.length ? (
                <ol className="space-y-0.5 text-sm">
                  {m.answers.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 tabular-nums">
                      {a.isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="ถูก" /> : <XCircle className="h-4 w-4 text-stone-400" aria-label="ยังไม่ถูก" />}
                      ครั้งที่ {a.attempt}: เลือก <b>{a.choiceId}</b> <span className="text-muted">· {Math.round(a.responseMs / 100) / 10} วิ</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-muted">ยังไม่ได้ตอบ</p>}
              {(m.hints > 0 || m.assists > 0) && <p className="mt-2 text-xs text-muted">คำใบ้ {m.hints} · ผู้ดูแลช่วย {m.assists}</p>}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Timeline การเล่น" className="xl:col-span-2">
          {!d.sessions.length ? <Empty>ยังไม่มี session</Empty> : d.sessions.map(s => (
            <div key={s.session_id} className="mb-6 last:mb-0">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                <b>{fmtDate(s.started_at)}</b><Badge kind={s.status}>{STATUS_TH[s.status]}</Badge>
                <span className="text-muted"><Clock className="mr-1 inline h-3.5 w-3.5" />{fmtDuration(s.duration_sec)} · หยุด {s.pause_count} · เล่นต่อ {s.resume_count}</span>
              </div>
              <ol className="relative ml-2 border-l border-line pl-5">
                {d.timeline.filter(e => e.session_id === s.session_id).map((e, i) => <TimelineItem key={i} e={e} />)}
              </ol>
            </div>
          ))}
        </Card>
        <ConsentCard d={d} canEdit={can(user, 'researcher')} onSaved={reload} />
      </div>
    </>
  )
}

function TimelineItem({ e }: { e: TimelineEvent }) {
  const meta = EVENT_TH[e.event_type] ?? { label: e.event_type, icon: Gauge }
  const Icon = meta.icon
  return (
    <li className="mb-2 text-sm">
      <span className="absolute -left-[9px] mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-white ring-1 ring-line"><Icon className="h-2.5 w-2.5 text-muted" aria-hidden /></span>
      <span className="tabular-nums text-muted">{new Date(e.occurred_at).toLocaleTimeString('th-TH', { timeStyle: 'medium' })}</span>{' '}
      <b>{meta.label}</b>{e.mission_id && <> {e.mission_id}</>}
      {e.event_type === 'answer' && <> · เลือก {e.choice_id} · {e.is_correct ? 'ถูก' : 'ยังไม่ถูก'} (ครั้งที่ {e.attempt}){e.caregiver_assisted ? ' · ผู้ดูแลช่วย' : ''}</>}
      {e.event_type === 'hint' && <> · ระดับ {e.hint_level}</>}
    </li>
  )
}

function ConsentCard({ d, canEdit, onSaved }: { d: ParticipantDetail; canEdit: boolean; onSaved: () => void }) {
  const [g, setG] = useState(false)
  const [c, setC] = useState(false)
  const [ref, setRef] = useState('')
  const [withdrawn, setW] = useState(false)
  const [msg, setMsg] = useState('')
  const save = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.recordConsent(d.participant.participant_id, { guardianConsent: g, childAssent: c, formReference: ref || undefined, withdrawn })
      setMsg('บันทึกแล้ว'); onSaved()
    } catch (x) { setMsg(x instanceof Error ? x.message : 'บันทึกไม่สำเร็จ') }
  }
  return (
    <Card title={<>Consent <Badge kind={d.participant.consent_status}>{CONSENT_TH[d.participant.consent_status]}</Badge></>}>
      {d.consent.length ? (
        <ul className="mb-4 space-y-2 text-sm">
          {d.consent.map((r, i) => (
            <li key={i} className="rounded-lg bg-stone-50 px-3 py-2">
              <div className="text-xs text-muted">{fmtDate(r.recorded_at)}{r.form_reference && ` · ${r.form_reference}`}</div>
              ผู้ปกครองยินยอม: {r.guardian_consent ? 'ใช่' : 'ไม่'} · เด็กยินยอม: {r.child_assent ? 'ใช่' : 'ไม่'}{r.withdrawn_at && <b className="text-rose-700"> · ถอนความยินยอม</b>}
            </li>
          ))}
        </ul>
      ) : <p className="mb-4 text-sm text-muted">ยังไม่มีบันทึก consent</p>}
      {canEdit && (
        <form onSubmit={save} className="space-y-2 border-t border-line pt-4 text-sm">
          <p className="font-medium">บันทึกสถานะใหม่</p>
          <label className="flex items-center gap-2"><input type="checkbox" checked={g} onChange={e => setG(e.target.checked)} className="h-4 w-4" /> ผู้ปกครอง/ผู้แทนโดยชอบธรรมยินยอม</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={c} onChange={e => setC(e.target.checked)} className="h-4 w-4" /> เด็กให้ความยินยอม (Assent)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={withdrawn} onChange={e => setW(e.target.checked)} className="h-4 w-4" /> ถอนความยินยอม</label>
          <input className={`${input} w-full`} placeholder="เลขอ้างอิงแบบฟอร์ม (ห้ามใส่ชื่อจริง)" maxLength={80} value={ref} onChange={e => setRef(e.target.value)} />
          <button className={btnPrimary}>บันทึก</button>
          {msg && <span className="ml-2 text-muted">{msg}</span>}
        </form>
      )}
    </Card>
  )
}

/* ================= Session ================= */

export function SessionsPage({ filter }: { filter: Filter }) {
  const { data, error } = useLoad(() => api.sessions(filter), [JSON.stringify(filter)])
  if (error) return <ErrorBox msg={error} />
  if (!data) return <Loading />
  return (
    <>
      {filter.demo !== 'exclude' && <DemoBanner />}
      <Card title={`Session ${data.length} รายการ`} action={
        <a className={btnGhost} href={api.exportUrl({ ...filter, dataset: 'sessions', format: 'csv' })}><Download className="h-4 w-4" /> ส่งออก CSV</a>
      }>
        {!data.length ? <Empty>ยังไม่มี session ที่ตรงกับตัวกรอง</Empty> : (
          <Table head={['เริ่ม', 'Participant', 'สถานะ', 'ระยะเวลา', 'ภารกิจสำเร็จ', 'ข้าม', 'หยุด', 'เล่นต่อ', 'คำใบ้', 'ผู้ดูแลช่วย', 'โหมด']}>
            {data.map((s: SessionRow) => (
              <tr key={s.session_id} className="hover:bg-stone-50">
                <td className="whitespace-nowrap px-3 py-2">{fmtDate(s.started_at)}</td>
                <td className="px-3 py-2 font-mono"><a className="text-brand-700 hover:underline" href={`#/participants/${s.participant_id}`}>{s.participant_id}</a></td>
                <td className="px-3 py-2"><Badge kind={s.status}>{STATUS_TH[s.status] ?? s.status}</Badge></td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{fmtDuration(s.duration_sec)}</td>
                <td className="px-3 py-2 tabular-nums">{s.missions_completed}/8</td>
                <td className="px-3 py-2 tabular-nums">{s.missions_skipped}</td>
                <td className="px-3 py-2 tabular-nums">{s.pause_count}</td>
                <td className="px-3 py-2 tabular-nums">{s.resume_count}</td>
                <td className="px-3 py-2 tabular-nums">{s.hints}</td>
                <td className="px-3 py-2 tabular-nums">{s.assists}</td>
                <td className="px-3 py-2 text-muted">{s.assistance_mode ?? '—'}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}

/* ================= ส่งออก ================= */

export function ExportPage({ filter }: { filter: Filter }) {
  const [dataset, setDataset] = useState('all')
  const [format, setFormat] = useState('xlsx')
  const DS = [
    { v: 'participants', l: 'ข้อมูลผู้เข้าร่วม', d: 'Participant ID, วันที่เข้าร่วม, จำนวน session, สถานะ consent (ไม่รวมชื่อเล่น)' },
    { v: 'sessions', l: 'ข้อมูล Session', d: 'เวลาเริ่ม/จบ, ระยะเวลา, สถานะ, หยุด/เล่นต่อ, คำใบ้, การช่วยเหลือ' },
    { v: 'missions', l: 'ข้อมูล Mission', d: 'ทุกคำตอบ: ภารกิจ, ตัวเลือก A/B, ถูก/ไม่ถูก, ครั้งที่, คำใบ้, ผู้ดูแลช่วย, เวลา' },
    { v: 'all', l: 'ข้อมูลทั้งหมด', d: 'ทั้ง 3 ชุด (Excel แยกเป็น 3 ชีต)' },
  ]
  return (
    <>
      {filter.demo !== 'exclude' && <DemoBanner />}
      <Card title="ส่งออกข้อมูล">
        <p className="mb-4 text-sm text-muted">ใช้ตัวกรองด้านบน (Participant ID, ช่วงวันที่, ประเภทข้อมูล) ก่อนส่งออก · ทุกการส่งออกถูกบันทึกใน Audit Log</p>
        <fieldset className="mb-5 grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium">ชุดข้อมูล</legend>
          {DS.map(x => (
            <label key={x.v} className={`cursor-pointer rounded-xl border p-3 text-sm ${dataset === x.v ? 'border-brand-500 bg-brand-50' : 'border-line'}`}>
              <input type="radio" name="ds" value={x.v} checked={dataset === x.v} onChange={() => setDataset(x.v)} className="mr-2" />
              <b>{x.l}</b><span className="mt-1 block text-muted">{x.d}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="mb-5 flex gap-4 text-sm">
          <legend className="mb-2 font-medium">รูปแบบไฟล์</legend>
          <label><input type="radio" name="fmt" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} className="mr-1" /> Excel (.xlsx)</label>
          <label><input type="radio" name="fmt" checked={format === 'csv'} onChange={() => setFormat('csv')} className="mr-1" /> CSV (UTF-8)</label>
        </fieldset>
        <a className={btnPrimary} href={api.exportUrl({ ...filter, dataset, format })}><Download className="h-4 w-4" /> ดาวน์โหลด</a>
      </Card>
    </>
  )
}
