import { useEffect, useRef, useState } from 'react'
import { NICKNAME_MAX, nicknameLength, sanitizeNickname } from './player'
import { bustImage } from '../shared/characters'

export interface SoundSettings { music: boolean; voice: boolean }

const soundLabel = (s: SoundSettings) => (s.voice ? 'ปิดเสียง' : 'เปิดเสียง')

/* ---------------- หน้าเข้าเกม (ใช้ภาพจากโฟลเดอร์ หน้าเข้าเกม) ---------------- */
// ปุ่มในภาพเป็นส่วนหนึ่งของภาพวาด จึงวางปุ่มโปร่งใสทับตำแหน่งปุ่มในภาพ (พิกัดบนเวที 1920×1080)

export function TitleScreen({ sound, onSound, onStart }: {
  sound: SoundSettings; onSound: (s: SoundSettings) => void; onStart: () => void
}) {
  const [panel, setPanel] = useState<null | 'settings' | 'credits'>(null)
  return (
    <div className="title-screen">
      <img className="bg" src="/assets/ui/title.jpg" alt="" draggable={false} />
      <h1 className="sr-only">ก้าวเล็ก ๆ — การเดินทางสู่สุขภาพของฉัน</h1>

      <button className="hotspot" style={{ left: 215, top: 420, width: 705, height: 245, borderRadius: 120 }} onClick={onStart} aria-label="เริ่มเกม" />
      <button className="hotspot" style={{ left: 215, top: 700, width: 328, height: 125, borderRadius: 62 }} onClick={() => setPanel('settings')} aria-label="ตั้งค่า" />
      <button className="hotspot" style={{ left: 575, top: 700, width: 345, height: 125, borderRadius: 62 }} onClick={() => setPanel('credits')} aria-label="คณะผู้จัดทำ" />
      <button className={`hotspot round${sound.music ? '' : ' muted'}`} style={{ left: 1570, top: 62, width: 122, height: 122 }}
        onClick={() => onSound({ ...sound, music: !sound.music })} aria-label={sound.music ? 'ปิดเพลง' : 'เปิดเพลง'} aria-pressed={!sound.music} />
      <button className={`hotspot round${sound.voice ? '' : ' muted'}`} style={{ left: 1726, top: 48, width: 140, height: 140 }}
        onClick={() => onSound({ ...sound, voice: !sound.voice })} aria-label={soundLabel(sound)} aria-pressed={!sound.voice} />

      {panel && (
        <div className="overlay" onClick={() => setPanel(null)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            {panel === 'settings' ? (
              <>
                <h2>ตั้งค่า</h2>
                <button className="btn toggle" onClick={() => onSound({ ...sound, music: !sound.music })}>🎵 เพลง: {sound.music ? 'เปิด' : 'ปิด'}</button>
                <button className="btn toggle" onClick={() => onSound({ ...sound, voice: !sound.voice })}>🔊 เสียงพากย์: {sound.voice ? 'เปิด' : 'ปิด'}</button>
              </>
            ) : (
              <>
                <h2>คณะผู้จัดทำ</h2>
                <p className="panel-text">(รอใส่รายชื่อ)</p>
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

export function NicknameScreen({ sound, onSound, name, setName, onStart, onHowTo, onBack }: {
  sound: SoundSettings; onSound: (s: SoundSettings) => void; name: string; setName: (s: string) => void
  onStart: (nickname: string) => void; onHowTo: () => void; onBack: () => void
}) {
  const [error, setError] = useState('')
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

      <button className="icon-btn nick-back" onClick={onBack} aria-label="กลับหน้าแรก">◀</button>
      <button className="icon-btn nick-sound" onClick={() => onSound({ ...sound, voice: !sound.voice })} aria-label={soundLabel(sound)}>
        {sound.voice ? '🔊' : '🔇'}
      </button>

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
