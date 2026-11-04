import { useEffect, useRef, useState } from 'react'
import { NICKNAME_MAX, nicknameLength, sanitizeNickname } from './player'
import { bustImage } from '../shared/characters'
import { setSound, useSound } from './audio'

/* ---------------- ตั้งค่าเสียง (ใช้ทั้งหน้าแรก หน้ากรอกชื่อ และในเกม) ---------------- */

export function SoundControls() {
  const s = useSound()
  return (
    <div className="sound-controls">
      <div className="sound-row">
        <span className="sound-name">🎵 เพลงพื้นหลัง</span>
        <button className={`btn sound-toggle${s.musicOn ? ' on' : ''}`} onClick={() => setSound({ musicOn: !s.musicOn })} aria-pressed={s.musicOn}>
          {s.musicOn ? 'เปิด' : 'ปิด'}
        </button>
        <input type="range" className="sound-range" min={0} max={100} step={5} value={Math.round(s.musicVolume * 100)}
          disabled={!s.musicOn} aria-label="ความดังเพลงพื้นหลัง"
          onChange={e => setSound({ musicVolume: Number(e.target.value) / 100 })} />
      </div>
      <div className="sound-row">
        <span className="sound-name">🔔 เสียงตอบคำถาม</span>
        <button className={`btn sound-toggle${s.sfxOn ? ' on' : ''}`} onClick={() => setSound({ sfxOn: !s.sfxOn })} aria-pressed={s.sfxOn}>
          {s.sfxOn ? 'เปิด' : 'ปิด'}
        </button>
        <input type="range" className="sound-range" min={0} max={100} step={5} value={Math.round(s.sfxVolume * 100)}
          disabled={!s.sfxOn} aria-label="ความดังเสียงตอบคำถาม"
          onChange={e => setSound({ sfxVolume: Number(e.target.value) / 100 })} />
      </div>
    </div>
  )
}

export function SoundPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()}>
        <h2>ตั้งค่าเสียง</h2>
        <SoundControls />
        <button className="btn btn-primary" onClick={onClose}>ปิด</button>
      </div>
    </div>
  )
}

/* ---------------- หน้าแรกสุด: ข้อความงานวิจัย (ข้อความตามที่อาจารย์กำหนด) ---------------- */

export const RESEARCH_STATEMENT =
  'เกมให้ความรู้นี้เป็นส่วนหนึ่งของงานวิจัยเรื่อง “ผลของโปรแกรมส่งเสริมสมรรถนะการรับรู้แห่งตนต่อพฤติกรรมป้องกันการกำเริบของโรคในเด็กวัยเรียนโรคลมชัก” ของคณะพยาบาลศาสตร์ มหาวิทยาลัยสวนดุสิต ร่วมกับสถาบันสุขภาพเด็กแห่งชาติมหาราชินี'

// แสดงข้อความ โดยไม่ตัดบรรทัดกลางชื่อเฉพาะ
const NO_BREAK = ['คณะพยาบาลศาสตร์', 'มหาวิทยาลัยสวนดุสิต', 'สถาบันสุขภาพเด็กแห่งชาติมหาราชินี', 'โรคลมชัก”', 'การรับรู้แห่งตน']
function Statement() {
  const re = new RegExp(`(${NO_BREAK.join('|')})`)
  return <>{RESEARCH_STATEMENT.split(re).map((s, i) => NO_BREAK.includes(s) ? <span key={i} className="nobr">{s}</span> : s)}</>
}

export function IntroScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="intro-screen">
      <img className="bg nick-bg" src="/assets/bg/scene01.jpg" alt="" draggable={false} />
      <div className="nick-veil" />
      <div className="intro-card">
        <img className="intro-logo" src="/assets/ui/logo.png" alt="ก้าวเล็ก ๆ" draggable={false} />
        <p className="intro-text"><Statement /></p>
        <button className="btn btn-big btn-mint" onClick={onNext} autoFocus>ต่อไป ▶</button>
      </div>
    </div>
  )
}

/* ---------------- หน้าเข้าเกม (ใช้ภาพจากโฟลเดอร์ หน้าเข้าเกม) ---------------- */
// ปุ่มในภาพเป็นส่วนหนึ่งของภาพวาด จึงวางปุ่มโปร่งใสทับตำแหน่งปุ่มในภาพ (พิกัดบนเวที 1920×1080)

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const sound = useSound()
  const [panel, setPanel] = useState<null | 'settings' | 'about'>(null)
  return (
    <div className="title-screen">
      <img className="bg" src="/assets/ui/title.jpg" alt="" draggable={false} />
      <p className="title-credit">พัฒนาโดย สาขาความมั่นคงไซเบอร์ มหาวิทยาลัยสวนดุสิต</p>
      <h1 className="sr-only">ก้าวเล็ก ๆ — การเดินทางสู่สุขภาพของฉัน</h1>

      <button className="hotspot" style={{ left: 215, top: 420, width: 705, height: 245, borderRadius: 120 }} onClick={onStart} aria-label="เริ่มเกม" />
      <button className="hotspot" style={{ left: 215, top: 700, width: 328, height: 125, borderRadius: 62 }} onClick={() => setPanel('settings')} aria-label="ตั้งค่า" />
      <button className="hotspot" style={{ left: 575, top: 700, width: 345, height: 125, borderRadius: 62 }} onClick={() => setPanel('about')} aria-label="เกี่ยวกับเกม">
        {/* ป้ายทับคำว่า “คณะผู้จัดทำ” ที่วาดอยู่ในภาพ */}
        <span className="title-label" aria-hidden>เกี่ยวกับ</span>
      </button>
      <button className={`hotspot round${sound.musicOn ? '' : ' muted'}`} style={{ left: 1570, top: 62, width: 122, height: 122 }}
        onClick={() => setSound({ musicOn: !sound.musicOn })} aria-label={sound.musicOn ? 'ปิดเพลง' : 'เปิดเพลง'} aria-pressed={!sound.musicOn} />
      <button className={`hotspot round${sound.sfxOn ? '' : ' muted'}`} style={{ left: 1726, top: 48, width: 140, height: 140 }}
        onClick={() => setSound({ sfxOn: !sound.sfxOn })} aria-label={sound.sfxOn ? 'ปิดเสียงตอบคำถาม' : 'เปิดเสียงตอบคำถาม'} aria-pressed={!sound.sfxOn} />

      {panel && (
        <div className="overlay" onClick={() => setPanel(null)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            {panel === 'settings' ? (
              <>
                <h2>ตั้งค่าเสียง</h2>
                <SoundControls />
              </>
            ) : (
              <>
                <h2>เกี่ยวกับเกม</h2>
                <p className="panel-text about-text"><Statement /></p>
              </>
            )}
            <button className="btn btn-primary" onClick={() => setPanel(null)}>ปิด</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- หน้ากรอกชื่อเล่น ---------------- */

export function NicknameScreen({ name, setName, onStart, onHowTo, onBack }: {
  name: string; setName: (s: string) => void
  onStart: (nickname: string) => void; onHowTo: () => void; onBack: () => void
}) {
  const [error, setError] = useState('')
  const [soundOpen, setSoundOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const mali = bustImage('mali', 'happy')
  const pui = bustImage('pui', 'happy')

  const submit = () => {
    const clean = sanitizeNickname(name).trim()
    if (!clean) {
      setError('หนูลองใส่ชื่อเล่นก่อนนะ')
      inputRef.current?.focus()
      return
    }
    onStart(clean)
  }

  return (
    <div className="nick-screen">
      <img className="bg nick-bg" src="/assets/bg/scene01.jpg" alt="" draggable={false} />
      <div className="nick-veil" />

      <header className="nick-head">
        <img className="nick-logo" src="/assets/ui/logo.png" alt="ก้าวเล็ก ๆ" draggable={false} />
        <p className="nick-title">Little Steps: My Health Journey</p>
        <p className="nick-welcome">ยินดีต้อนรับสู่การผจญภัยของมะลิและปุย</p>
      </header>

      <img className="nick-char nick-mali" src={mali.src} alt="มะลิ" draggable={false} />
      <img className="nick-char nick-pui" src={pui.src} alt="ปุย" draggable={false} />

      <form className="nick-card" onSubmit={e => { e.preventDefault(); submit() }} noValidate>
        <label htmlFor="nickname" className="nick-label">หนูชื่อเล่นอะไรจ๊ะ?</label>
        <input
          id="nickname"
          ref={inputRef}
          className={`nick-input${error ? ' invalid' : ''}`}
          value={name}
          onChange={e => { setName(sanitizeNickname(e.target.value)); setError('') }}
          placeholder="พิมพ์ชื่อเล่นของหนูที่นี่"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-invalid={!!error}
          aria-describedby="nick-hint"
        />
        <p id="nick-hint" className={`nick-hint${error ? ' error' : ''}`} role={error ? 'alert' : undefined}>
          {error || `ใส่แค่ชื่อเล่นนะ ไม่ต้องใส่ชื่อจริง · ${nicknameLength(name)}/${NICKNAME_MAX}`}
        </p>
      </form>

      <div className="nick-actions">
        <button className="btn btn-big btn-mint" onClick={submit}>เริ่มการผจญภัย ▶</button>
        <button className="btn btn-big btn-blue" onClick={onHowTo}>วิธีเล่น 📖</button>
      </div>

      {/* วางหลังส่วนหัว เพื่อให้อยู่ด้านบนและกดได้ */}
      <button className="icon-btn nick-back" onClick={onBack} aria-label="กลับหน้าแรก">◀</button>
      <button className="icon-btn nick-sound" onClick={() => setSoundOpen(true)} aria-label="ตั้งค่าเสียง">🎵</button>
      {soundOpen && <SoundPanel onClose={() => setSoundOpen(false)} />}
    </div>
  )
}

/* ---------------- หน้าวิธีเล่น ---------------- */

const HOWTO = [
  { img: '/assets/characters/pui/bust-curious.png', icon: '▶', text: 'ฟังเรื่องราว แล้วแตะ “ต่อไป”' },
  { img: '/assets/choices/m01_a.jpg', icon: '👆', text: 'แตะเลือกรูปที่หนูคิดว่าดีที่สุด' },
  { img: null, icon: '💡', text: 'ไม่แน่ใจ? แตะหลอดไฟ ปุยจะช่วยใบ้' },
  { img: null, icon: '⏸', text: 'อยากพัก แตะปุ่มพักได้ตลอดเวลา' },
]

export function HowToScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="howto-screen">
      <img className="bg nick-bg" src="/assets/bg/scene01.jpg" alt="" draggable={false} />
      <div className="nick-veil" />
      <h2 className="howto-title">วิธีเล่น</h2>
      <div className="howto-grid">
        {HOWTO.map((h, i) => (
          <div key={i} className="howto-card">
            <div className="howto-pic">
              {h.img ? <img src={h.img} alt="" draggable={false} /> : <span className="howto-icon">{h.icon}</span>}
              <span className="howto-num">{i + 1}</span>
            </div>
            <p>{h.text}</p>
          </div>
        ))}
      </div>
      <p className="howto-note">ไม่มีจับเวลา ตอบไม่ถูกก็ลองใหม่ได้เสมอนะ 💛</p>
      <button className="btn btn-big btn-primary howto-back" onClick={onBack}>◀ กลับหน้าแรก</button>
    </div>
  )
}

/* ---------------- หน้าโหลด ---------------- */

export function LoadingScreen({ nickname, onDone }: { nickname: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="loading-screen" role="status">
      <img className="loading-pui" src="/assets/characters/pui/bust-happy.png" alt="" draggable={false} />
      <p className="loading-text">สวัสดี {nickname}! กำลังเตรียมการผจญภัย</p>
      <div className="loading-dots" aria-hidden><span /><span /><span /></div>
    </div>
  )
}
