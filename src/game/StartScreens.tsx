import { useEffect, useRef, useState } from 'react'
import { NICKNAME_MAX, nicknameLength, sanitizeNickname } from './player'
import { bodyImage, bustImage, faceImage } from '../shared/characters'
import { HEROES, type CharacterType } from '../shared/hero'
import { setSound, useSound } from './audio'
import { BackIcon, BookIcon, BulbIcon, CheckIcon, GearIcon, MusicIcon, PauseIcon, PenIcon, PlayIcon, SpeakerIcon, StarIcon, TapIcon } from './Icons'

/* ---------------- ตั้งค่าเสียง (ใช้ทั้งหน้าแรก หน้ากรอกชื่อ และในเกม) ---------------- */

export function SoundControls() {
  const s = useSound()
  return (
    <div className="sound-controls">
      <div className="sound-row">
        <span className="sound-name"><MusicIcon size={44} /> เพลงพื้นหลัง</span>
        <button className={`btn sound-toggle${s.musicOn ? ' on' : ''}`} onClick={() => setSound({ musicOn: !s.musicOn })} aria-pressed={s.musicOn}>
          {s.musicOn ? 'เปิด' : 'ปิด'}
        </button>
        <input type="range" className="sound-range" min={0} max={100} step={5} value={Math.round(s.musicVolume * 100)}
          disabled={!s.musicOn} aria-label="ความดังเพลงพื้นหลัง"
          onChange={e => setSound({ musicVolume: Number(e.target.value) / 100 })} />
      </div>
      <div className="sound-row">
        <span className="sound-name"><SpeakerIcon size={44} /> เสียงตอบคำถาม</span>
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
      <div className="panel rpg-frame" onClick={e => e.stopPropagation()}>
        <h2>ตั้งค่าเสียง</h2>
        <SoundControls />
        <button className="btn btn-primary" onClick={onClose}>ปิด</button>
      </div>
    </div>
  )
}

/* ---------------- โลโก้เกม (ตัวอักษรทองแบบแฟนตาซี) ---------------- */

export function GameLogo({ size = 'lg', as: Tag = 'div' }: { size?: 'lg' | 'md' | 'sm'; as?: 'div' | 'h1' }) {
  return (
    <Tag className={`game-logo logo-${size}`} aria-label="ก้าวเล็ก ๆ — Little Steps: The Guardian's Journey">
      <span className="logo-th" aria-hidden>ก้าวเล็ก ๆ</span>
      <span className="logo-ribbon" aria-hidden><i />LITTLE STEPS<b>·</b>THE GUARDIAN'S JOURNEY<i /></span>
    </Tag>
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
      <img className="bg nick-bg" src="/assets/bg2/scene19.jpg" alt="" draggable={false} />
      <div className="nick-veil" />
      <div className="intro-card rpg-frame">
        <GameLogo size="md" />
        <p className="intro-text"><Statement /></p>
        <button className="btn btn-big btn-primary" onClick={onNext} autoFocus>ต่อไป ▶</button>
      </div>
    </div>
  )
}

/* ---------------- เมนูหลัก (Fantasy RPG) ---------------- */

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const sound = useSound()
  const [panel, setPanel] = useState<null | 'settings' | 'about'>(null)
  return (
    <div className="title-screen">
      <img className="bg" src="/assets/bg2/scene01.jpg" alt="" draggable={false} />
      <div className="menu-veil" aria-hidden />
      <img className="menu-char menu-mali" src="/assets/characters2/mali/body.webp" alt="" draggable={false} />
      <img className="menu-char menu-pui" src="/assets/characters2/pui/body.webp" alt="" draggable={false} />

      <GameLogo as="h1" />

      <nav className="menu-btns" aria-label="เมนูหลัก">
        <button className="menu-btn menu-start" onClick={onStart}>
          <PlayIcon size={60} /><span>เริ่มการผจญภัย</span>
        </button>
        <button className="menu-btn" onClick={() => setPanel('settings')}>
          <GearIcon size={52} /><span>ตั้งค่า</span>
        </button>
        <button className="menu-btn" onClick={() => setPanel('about')}>
          <BookIcon size={52} /><span>เกี่ยวกับ</span>
        </button>
      </nav>

      <div className="menu-sound">
        <button className={`coin-btn${sound.musicOn ? '' : ' off'}`} onClick={() => setSound({ musicOn: !sound.musicOn })}
          aria-label={sound.musicOn ? 'ปิดเพลง' : 'เปิดเพลง'} aria-pressed={sound.musicOn}><MusicIcon size={64} /></button>
        <button className={`coin-btn${sound.sfxOn ? '' : ' off'}`} onClick={() => setSound({ sfxOn: !sound.sfxOn })}
          aria-label={sound.sfxOn ? 'ปิดเสียงตอบคำถาม' : 'เปิดเสียงตอบคำถาม'} aria-pressed={sound.sfxOn}><SpeakerIcon size={64} /></button>
      </div>

      <p className="title-credit">พัฒนาโดย สาขาความมั่นคงไซเบอร์ มหาวิทยาลัยสวนดุสิต</p>

      {panel && (
        <div className="overlay" onClick={() => setPanel(null)}>
          <div className="panel rpg-frame" onClick={e => e.stopPropagation()}>
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
  const mali = bustImage('mali', 'happy')!
  const pui = bustImage('pui', 'happy')!

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
      <img className="bg nick-bg" src="/assets/bg2/scene04.jpg" alt="" draggable={false} />
      <div className="nick-veil" />

      <header className="nick-head">
        <GameLogo size="sm" />
        <p className="nick-welcome">ยินดีต้อนรับสู่การผจญภัยของมะลิและปุย</p>
      </header>

      <img className="nick-char nick-mali" src={mali.src} alt="มะลิ" draggable={false} />
      <img className="nick-char nick-pui" src={pui.src} alt="ปุย" draggable={false} />

      <form className="nick-card rpg-frame" onSubmit={e => { e.preventDefault(); submit() }} noValidate>
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
        <button className="btn btn-big btn-primary" onClick={submit}>เริ่มการผจญภัย ▶</button>
        <button className="btn btn-big btn-icon" onClick={onHowTo}><BookIcon size={52} /> วิธีเล่น</button>
      </div>

      {/* วางหลังส่วนหัว เพื่อให้อยู่ด้านบนและกดได้ */}
      <button className="icon-btn nick-back" onClick={onBack} aria-label="กลับหน้าแรก"><BackIcon size={56} /></button>
      <button className="icon-btn nick-sound" onClick={() => setSoundOpen(true)} aria-label="ตั้งค่าเสียง"><MusicIcon size={56} /></button>
      {soundOpen && <SoundPanel onClose={() => setSoundOpen(false)} />}
    </div>
  )
}

/* ---------------- หน้าเลือกตัวละคร + กรอกชื่อเล่น ---------------- */

export const NICK_MIN = 2
export const NICK_MAX = 16

/** ตรวจชื่อเล่น — คืนข้อความแจ้งเตือน (ภาษาไทยสุภาพ) หรือ '' ถ้าใช้ได้ */
export function nicknameError(name: string): string {
  const clean = name.trim()
  if (!clean) return 'กรุณาพิมพ์ชื่อเล่นก่อนนะ'
  if (nicknameLength(clean) < NICK_MIN) return `ชื่อเล่นต้องมีอย่างน้อย ${NICK_MIN} ตัวอักษรนะ`
  return ''
}

export function CharacterSelectScreen({ name, setName, hero, setHero, onStart, onHowTo, onBack }: {
  name: string; setName: (s: string) => void
  hero: CharacterType | null; setHero: (h: CharacterType) => void
  onStart: (nickname: string, hero: CharacterType) => void; onHowTo: () => void; onBack: () => void
}) {
  const [touched, setTouched] = useState(false)
  const [soundOpen, setSoundOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const error = nicknameError(name)
  const ready = !error && hero !== null
  const chosen = hero ? HEROES[hero] : null
  // ชื่อสำหรับแสดงตัวอย่าง: ผ่านการกรองอักขระแล้ว และ React แสดงเป็นข้อความธรรมดาเสมอ (ไม่ตีความ HTML)
  const preview = name.trim()

  const submit = () => {
    setTouched(true)
    if (error) { inputRef.current?.focus(); return }
    if (hero) onStart(preview, hero)
  }

  return (
    <div className="select-screen">
      <img className="bg nick-bg" src="/assets/bg2/scene04.jpg" alt="" draggable={false} />
      <div className="nick-veil" />

      <header className="select-head">
        <h1>เลือกตัวละครของคุณ</h1>
        <p className="select-sub"><i />CHOOSE YOUR GUARDIAN<i /></p>
        <p className="select-lead">ก่อนออกเดินทาง มาเลือกตัวละครที่คุณชอบกันเถอะ</p>
      </header>

      <div className="select-tools">
        <button className="icon-btn" onClick={onHowTo} aria-label="วิธีเล่น"><BookIcon size={56} /></button>
        <button className="icon-btn" onClick={() => setSoundOpen(true)} aria-label="ตั้งค่าเสียง"><MusicIcon size={56} /></button>
      </div>

      {/* ซ้าย: ชื่อเล่น + ตัวอย่าง */}
      <section className="select-left rpg-frame">
        <form className="nick-form" onSubmit={e => { e.preventDefault(); submit() }} noValidate>
          <label htmlFor="nickname" className="nick-label"><PenIcon size={46} /> คุณอยากให้เราเรียกคุณว่าอะไร?</label>
          <input
            id="nickname"
            ref={inputRef}
            className={`nick-input${touched && error ? ' invalid' : ''}`}
            value={name}
            onChange={e => setName(graphemesSlice(sanitizeNickname(e.target.value), NICK_MAX))}
            onBlur={() => name && setTouched(true)}
            placeholder="พิมพ์ชื่อเล่นของคุณ..."
            autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="done"
            aria-invalid={touched && !!error} aria-describedby="nick-hint"
          />
          <p id="nick-hint" className={`nick-hint${touched && error ? ' error' : ''}`} role={touched && error ? 'alert' : undefined}>
            {touched && error ? error : `ใช้ชื่อเล่นเท่านั้น ไม่ต้องใช้ชื่อจริง · ${nicknameLength(name)}/${NICK_MAX}`}
          </p>
        </form>

        <div className={`select-preview${chosen ? ' has-hero' : ''}`} aria-live="polite">
          <div className="preview-art" aria-hidden>
            {chosen
              ? <img key={chosen.characterId} className="preview-hero" src={faceImage(chosen.characterId, 'happy')} alt="" draggable={false} />
              : <span className="preview-empty">?</span>}
            <img className="preview-pui" src="/assets/characters2/pui/bust-happy.webp" alt="" draggable={false} />
          </div>
          <p className="preview-text">
            ยินดีต้อนรับ <b>{preview || '…'}</b>!
            <small>{chosen ? `ออกผจญภัยในฐานะ${chosen.name} พร้อมปุยนุ่ม` : 'เลือกตัวละครทางขวาได้เลย'}</small>
          </p>
        </div>
      </section>

      {/* ขวา: การ์ดตัวละคร */}
      <div className="select-cards" role="radiogroup" aria-label="เลือกตัวละคร">
        {(['male', 'female'] as CharacterType[]).map(type => {
          const h = HEROES[type]
          const on = hero === type
          return (
            <button key={type} role="radio" aria-checked={on} className={`hero-card${on ? ' on' : ''}${hero && !on ? ' dim' : ''}`}
              onClick={() => setHero(type)}>
              <span className="hero-tag">{h.title}</span>
              <span className="hero-art"><img src={bodyImage(h.characterId)} alt="" draggable={false} /></span>
              <span className="hero-info">
                <b className="hero-name">{h.name}</b>
                <span className="hero-desc">{h.desc}</span>
              </span>
              {on && <span className="hero-picked"><CheckIcon size={36} /> เลือกตัวละครนี้แล้ว</span>}
            </button>
          )
        })}
      </div>

      <div className="select-actions">
        <button className="btn btn-big btn-back-big" onClick={onBack}><BackIcon size={48} /> ย้อนกลับ</button>
        <p className="select-status" aria-live="polite">
          {ready ? '' : error && hero ? 'พิมพ์ชื่อเล่นก่อนนะ' : !hero && !error ? 'เลือกตัวละครก่อนนะ' : 'พิมพ์ชื่อเล่นและเลือกตัวละครก่อนนะ'}
        </p>
        <button className="btn btn-big btn-emerald" onClick={submit} disabled={!ready}><StarIcon size={52} /> เริ่มการผจญภัย</button>
      </div>

      {soundOpen && <SoundPanel onClose={() => setSoundOpen(false)} />}
    </div>
  )
}

const graphemesSlice = (s: string, n: number) => {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter
  const parts = Seg ? Array.from(new Seg('th', { granularity: 'grapheme' }).segment(s), x => x.segment) : Array.from(s)
  return parts.slice(0, n).join('')
}

/* ---------------- หน้าวิธีเล่น ---------------- */

const HOWTO = [
  { img: '/assets/characters2/pui/bust-curious.webp', icon: <PlayIcon size={150} />, text: 'ฟังเรื่องราว แล้วแตะ “ต่อไป”' },
  { img: null, icon: <TapIcon size={150} />, text: 'แตะเลือกรูปที่หนูคิดว่าดีที่สุด' },
  { img: null, icon: <BulbIcon size={150} />, text: 'ไม่แน่ใจ? แตะหลอดไฟ ปุยจะช่วยใบ้' },
  { img: null, icon: <PauseIcon size={150} />, text: 'อยากพัก แตะปุ่มพักได้ตลอดเวลา' },
]

export function HowToScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="howto-screen">
      <img className="bg nick-bg" src="/assets/bg2/scene02.jpg" alt="" draggable={false} />
      <div className="nick-veil" />
      <h2 className="howto-title">วิธีเล่น</h2>
      <div className="howto-grid">
        {HOWTO.map((h, i) => (
          <div key={i} className="howto-card rpg-frame">
            <div className="howto-pic">
              {h.img ? <img src={h.img} alt="" draggable={false} /> : <span className="howto-icon">{h.icon}</span>}
              <span className="howto-num">{i + 1}</span>
            </div>
            <p>{h.text}</p>
          </div>
        ))}
      </div>
      <p className="howto-note">ไม่มีจับเวลา ตอบไม่ถูกก็ลองใหม่ได้เสมอนะ</p>
      <button className="btn btn-big btn-primary howto-back" onClick={onBack}>◀ กลับ</button>
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
      <img className="loading-pui" src="/assets/characters2/pui/bust-happy.webp" alt="" draggable={false} />
      <p className="loading-text">สวัสดี {nickname}! กำลังเตรียมการผจญภัย</p>
      <div className="loading-dots" aria-hidden><span /><span /><span /></div>
    </div>
  )
}
