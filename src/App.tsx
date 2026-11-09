import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Stage } from './game/Stage'
import { RotateGate, enterLandscapeFullscreen } from './game/RotateGate'
import { Placeholder } from './game/Placeholder'
import { choiceArt, choiceArtFromPath } from './shared/choiceArt'
import { SCENES, CHARACTER_NAMES } from './shared/scenes'
import { areaOf, buildSteps, story, type Step } from './game/storyFlow'
import type { Line, Mission } from './shared/story.types'
import { bodyImage, bustImage, faceImage } from './shared/characters'
import { CharacterSelectScreen, IntroScreen, HowToScreen, LoadingScreen, SoundControls, SoundPanel, TitleScreen } from './game/StartScreens'
import { DEFAULT_HERO, HEROES, heroCharId, personalize, type CharacterType, type HeroDef } from './shared/hero'
import { getSound, playSfx, unlockAudio } from './game/audio'
import { AutoPlayIcon, BulbIcon, CheckIcon, MusicIcon, PauseIcon, ReplayIcon } from './game/Icons'
import { StoryIcon, stripLeadingEmoji } from './game/StoryIcons'
import { SPEED_LABEL, SPEED_MS, graphemes, setTextPrefs, useTextPrefs, type TextSpeed } from './game/textPrefs'
import { createSession, endSession, startTracking, track, type PlayerSession } from './game/player'

type Screen = 'intro' | 'title' | 'select' | 'howto' | 'loading' | 'game'

export default function App() {
  const steps = useMemo(buildSteps, [])
  const [screen, setScreen] = useState<Screen>('intro')
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [session, setSession] = useState<PlayerSession | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftHero, setDraftHero] = useState<CharacterType | null>(null)

  const openNickname = async () => {
    unlockAudio()
    await enterLandscapeFullscreen()
    setScreen('select')
  }

  const begin = (nickname: string, hero: CharacterType) => {
    const s = createSession(nickname, hero)
    setSession(s)
    startTracking(s, { musicOn: getSound().musicOn, voiceOn: false }) // เกมไม่มีเสียงพากย์
    setIdx(0)
    setScreen('loading')
  }

  const toGame = useCallback(() => setScreen('game'), [])

  const goHome = () => {
    track({ type: 'exit', stepIndex: idx })
    endSession('interrupted')
    setPaused(false)
    setScreen('title')
  }

  const next = () => {
    if (idx < steps.length - 1) setIdx(idx + 1)
    else { endSession('completed'); setScreen('title') }
  }

  useEffect(() => {
    if (screen === 'game') {
      track({ type: 'step_view', stepIndex: idx })
      const st = steps[idx]
      if (st.kind === 'mission') track({ type: 'mission_start', missionId: st.mission.missionId })
    }
  }, [screen, idx, steps])

  return (
    <RotateGate>
      <Stage>
        {screen === 'intro' && <IntroScreen onNext={() => { unlockAudio(); setScreen('title') }} />}
        {screen === 'title' && <TitleScreen onStart={openNickname} />}
        {screen === 'select' && (
          <CharacterSelectScreen name={draftName} setName={setDraftName} hero={draftHero} setHero={setDraftHero}
            onStart={begin} onHowTo={() => setScreen('howto')} onBack={() => setScreen('title')} />
        )}
        {screen === 'howto' && <HowToScreen onBack={() => setScreen('select')} />}
        {screen === 'loading' && <LoadingScreen nickname={session?.nickname ?? ''} onDone={toGame} />}
        {screen === 'game' && (
          <StepView
            key={idx}
            step={steps[idx]}
            nickname={session?.nickname ?? ''}
            hero={session ? HEROES[session.characterType] : DEFAULT_HERO}
            prevSceneId={idx > 0 ? steps[idx - 1].sceneId : null}
            badges={steps.slice(0, idx + 1).flatMap(s => s.kind === 'badge' ? [s.area.id] : [])}
            prevSpeaker={idx > 0 && steps[idx - 1].kind === 'line' ? (steps[idx - 1] as { line: Line }).line.speaker : null}
            canBack={idx > 0}
            paused={paused}
            onNext={next}
            onPrev={() => setIdx(Math.max(idx - 1, 0))}
            onPause={() => { setPaused(true); track({ type: 'pause' }) }}
          />
        )}
        {paused && (
          <div className="overlay">
            <div className="panel rpg-frame">
              <h2>พักก่อนนะ</h2>
              <SoundControls />
              <TextControls />
              <button className="btn btn-primary" onClick={() => { setPaused(false); track({ type: 'resume' }) }}>เล่นต่อ</button>
              <button className="btn" onClick={goHome}>กลับหน้าแรก</button>
            </div>
          </div>
        )}
      </Stage>
    </RotateGate>
  )
}

interface StepProps { step: Step; nickname: string; hero: HeroDef; badges: string[]; prevSceneId: string | null; prevSpeaker: string | null; canBack: boolean; paused: boolean; onNext: () => void; onPrev: () => void; onPause: () => void }

function StepView({ step, nickname, hero, badges, prevSceneId, prevSpeaker, canBack, paused, onNext, onPrev, onPause }: StepProps) {
  const scene = SCENES.find(s => s.id === step.sceneId) ?? SCENES[0]
  const mission = step.kind === 'mission' ? step.mission : null
  // เปลี่ยนฉาก → ค่อย ๆ จางเข้า · เข้าฉากกลางคืนจากฉากกลางวัน → ค่อย ๆ มืดลง (ไม่มีความสว่างเปลี่ยนฉับพลัน)
  const prevScene = SCENES.find(s => s.id === prevSceneId)
  const bgAnim = scene.night && !prevScene?.night ? ' dusk' : prevScene?.bg !== scene.bg ? ' scene-in' : ''
  // ภารกิจที่เกี่ยวข้องกับขั้นนี้ (ใช้แสดงชื่อบนแถบด้านบน)
  const chipMission = step.kind === 'mission' || step.kind === 'explore' ? step.mission : null
  // สำรวจฉาก: สิ่งของที่แตะดูแล้ว (ไม่บันทึกข้อมูล ไม่นับคะแนน)
  const [explored, setExplored] = useState<number[]>([])
  const [exploreText, setExploreText] = useState<string | null>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const attempts = useRef(0)
  const shownAt = useRef(Date.now())
  const [soundOpen, setSoundOpen] = useState(false)

  const pick = (id: string) => {
    if (!mission) return
    const c = mission.choices.find(x => x.id === id)!
    attempts.current += 1
    track({ type: 'answer', missionId: mission.missionId, choiceId: c.id, isCorrect: c.isCorrect, attempt: attempts.current,
      responseMs: Date.now() - shownAt.current, hintsUsed: hintLevel, caregiverAssisted: false }) // เอาปุ่ม "ผู้ดูแลช่วย" ออกแล้ว — ส่งค่าเดิมเป็น false เพื่อให้รูปแบบข้อมูลวิจัยคงเดิม
    setPicked(id)
    playSfx(c.isCorrect ? 'correct' : 'wrong')
  }

  // ข้อความในกล่องบทสนทนาของขั้นตอนนี้
  let line: Line
  let lineIcon: string | null = null // ไอคอนวาดเองหน้าข้อความ (เช่น หลอดไฟตอนใบ้)
  let canContinue = true
  if (step.kind === 'line') line = step.line
  else if (step.kind === 'mission') {
    const choice = step.mission.choices.find(c => c.id === picked)
    if (choice) line = { speaker: 'pui', text: choice.feedback, emotion: choice.isCorrect ? 'happy' : 'gentle' }
    else if (hintLevel > 0) { line = { speaker: 'pui', text: step.mission.hints[hintLevel - 1] }; lineIcon = '💡' }
    else line = step.mission.question
    canContinue = !!choice?.isCorrect
  } else if (step.kind === 'explore') {
    line = exploreText
      ? { speaker: 'pui', text: exploreText, emotion: 'happy' }
      : { speaker: 'pui', text: 'มาสำรวจกันเถอะ! แตะสิ่งของเพื่อดูรายละเอียด หรือกด “ต่อไป” ได้เลยนะ', emotion: 'curious' }
  } else if (step.kind === 'badge') line = { speaker: 'narrator', text: `ได้รับ${step.area.badge.name}!` }
  else if (step.kind === 'memories') line = { speaker: 'narrator', text: 'ความทรงจำจากการเดินทางวันนี้' }
  else line = { speaker: 'narrator', text: story.ending.finalMessage }

  // ข้อความที่ขึ้นต้นด้วย 💡 (เช่น คำอธิบายหลังตอบ) → แสดงเป็นไอคอนหลอดไฟวาดเองแทนอีโมจิ
  const lead = /^💡\s*/u.exec(line.text)
  if (lead) { lineIcon = '💡'; line = { ...line, text: line.text.slice(lead[0].length) } }

  const hasPanel = step.kind !== 'line'
  // ภาพครึ่งตัวของผู้พูด — ไม่แสดงตอนมีแผง (ตัวเลือก/สำรวจ) เพื่อไม่บัง
  const bust = line.speaker !== 'narrator' && !hasPanel ? bustImage(heroCharId(line.speaker, hero), line.emotion) : null
  const charsHidden = line.speaker !== 'narrator' || step.kind === 'memories' || step.kind === 'badge'
  const prevHidden = prevSpeaker !== null && prevSpeaker !== 'narrator'
  const speakerName = line.speaker === 'narrator' ? '' : CHARACTER_NAMES[heroCharId(line.speaker, hero)]

  // ข้อความค่อย ๆ ขึ้นทีละตัว (ปรับความเร็วได้ / แตะกล่องเพื่อแสดงทั้งหมด) — ไม่มีการกะพริบ
  const prefs = useTextPrefs()
  const shownText = personalize(line.text, nickname, hero, line.speaker)
  const chars = useMemo(() => graphemes(shownText), [shownText])
  const [replay, setReplay] = useState(0)
  const [count, setCount] = useState(() => (SPEED_MS[prefs.speed] ? 0 : chars.length))
  const speedRef = useRef(prefs.speed)
  speedRef.current = prefs.speed
  useEffect(() => { setCount(SPEED_MS[speedRef.current] ? 0 : chars.length) }, [chars, replay])
  useEffect(() => {
    if (count >= chars.length) return
    const ms = SPEED_MS[prefs.speed]
    if (!ms) { setCount(chars.length); return }
    const t = setTimeout(() => setCount(c => c + 1), ms)
    return () => clearTimeout(t)
  }, [count, chars, prefs.speed])
  const typing = count < chars.length
  const finishTyping = () => setCount(chars.length)

  // เล่นอัตโนมัติ (ผู้เล่นเปิดเอง): เฉพาะบทพูดธรรมดา ไม่เร่งตอนต้องตัดสินใจ หยุดเมื่อพักเกม
  const nextRef = useRef(onNext)
  nextRef.current = onNext
  useEffect(() => {
    if (!prefs.auto || paused || soundOpen || typing || step.kind !== 'line') return
    const t = setTimeout(() => nextRef.current(), 1800 + chars.length * 45)
    return () => clearTimeout(t)
  }, [prefs.auto, paused, soundOpen, typing, step.kind, chars.length])
  const showHint = () => {
    if (!mission) return
    const level = Math.min(hintLevel + 1, mission.hints.length)
    track({ type: 'hint', missionId: mission.missionId, level })
    setHintLevel(level)
  }

  return (
    <div className="scene">
      {scene.bg
        ? <img className={`bg${bgAnim === ' scene-in' ? bgAnim : ''}`} src={scene.bg} alt={personalize(scene.title, nickname, hero)} draggable={false} />
        : <Placeholder label={`พื้นหลัง: ${scene.title}`} className="bg" />}

      {/* โทนกลางคืน: ชั้นสีน้ำเงินเข้มทับภาพ ค่อย ๆ จางเข้าเมื่อตะวันตก */}
      {scene.night && <div className={`night-tint${bgAnim === ' dusk' ? ' dusk' : ''}`} aria-hidden />}

      <div className="hud-top">
        <div className="hud-left">
          <span className="chip">{personalize(chipMission ? `${areaOf(chipMission)?.name} · ${chipMission.title}` : `${scene.location} · ${scene.title}`, nickname, hero)}</span>
          {/* ตราผู้พิทักษ์ที่ได้แล้ว (แผนที่ความคืบหน้า) */}
          <span className="badge-bar" aria-label={`ตราผู้พิทักษ์ ${badges.length} จาก 4`}>
            {story.areas.map(a => (
              <span key={a.id} className={`badge-slot${badges.includes(a.id) ? ' got' : ''}`} title={a.badge.name}><StoryIcon icon={a.badge.icon} size={44} /></span>
            ))}
          </span>
        </div>
        <div className="hud-btns">
          <button className="icon-btn" aria-label="ตั้งค่าเสียง" onClick={() => setSoundOpen(true)}><MusicIcon size={60} /></button>
          {step.kind === 'mission' && <button className="icon-btn" aria-label="คำใบ้" onClick={showHint}><BulbIcon size={60} /></button>}
          <button className="icon-btn" aria-label="หยุดพัก" onClick={onPause}><PauseIcon size={60} /></button>
        </div>
      </div>

      {/* ตัวละครยืนในฉาก — วางบนพื้นเดียวกัน ผู้ใหญ่หันหน้าเข้าหามะลิ */}
      {/* มีคนพูด → ซ่อนตัวละครที่ยืนในฉาก ให้เหลือแค่ภาพผู้พูดด้านขวา / ผู้บรรยาย → แสดงตัวละครในฉาก */}
      <div className={`characters${charsHidden ? ' hidden' : ''}${charsHidden !== prevHidden ? (charsHidden ? ' fade-out' : ' fade-in') : ''}`}>
        {scene.characters.map(c => (
          <div key={c} className={`slot slot-${c}${line.speaker === c ? ' speaking' : ''}${line.speaker !== 'narrator' && line.speaker !== c ? ' listening' : ''}`}>
            <img src={bodyImage(heroCharId(c, hero))} alt={CHARACTER_NAMES[heroCharId(c, hero)]} draggable={false} className={`char char-${c}`} />
          </div>
        ))}
      </div>

      {/* ภาพครึ่งตัวของผู้พูด แสดงข้างกล่องบทสนทนา */}
      {/* ไม่แสดงตอนมีตัวเลือก เพื่อไม่ให้บังรูปตัวเลือก — ใช้รูปหน้าเล็กในกล่องแทน */}
      {bust && (
        <div className={`bust${line.speaker !== prevSpeaker ? ' enter' : ''}`} aria-hidden>
          <img key={bust.key} src={bust.src} alt="" draggable={false} style={{ width: bust.width, top: bust.top }} />
        </div>
      )}

      {step.kind === 'mission' && <ChoiceGrid mission={step.mission} picked={picked} onPick={pick} label={s => personalize(s, nickname, hero)} hero={hero} />}


      {step.kind === 'explore' && (
        <div className="choices explore">
          {step.items.map((it, i) => (
            <button key={it.label} className={`explore-item${explored.includes(i) ? ' seen' : ''}`}
              onClick={() => { setExploreText(it.text); setExplored(e => e.includes(i) ? e : [...e, i]) }}>
              <span className="explore-icon" aria-hidden><StoryIcon icon={it.icon} size={130} /></span>
              <span className="explore-label">{personalize(it.label, nickname, hero)}</span>
              {explored.includes(i) && <span className="explore-check" aria-label="ดูแล้ว"><CheckIcon size={38} /></span>}
            </button>
          ))}
        </div>
      )}

      {step.kind === 'badge' && (
        <div className="badge-reward" role="status">
          <span className="badge-big" aria-hidden><StoryIcon icon={step.area.badge.icon} size={200} /></span>
          <b>{step.area.badge.name}</b>
          <span>{step.area.name}</span>
        </div>
      )}

      {step.kind === 'memories' && (
        <div className="choices memories">
          {story.ending.memories.map(m => (
            <div key={m.areaId} className="memory-card">
              <div className="memory-pics">
                {m.images.map(src => {
                  const art = choiceArtFromPath(src, hero)
                  return art
                    ? <img key={src} src={art} alt="" draggable={false} />
                    : <Placeholder key={src} className="memory-ph" label="รอภาพ" />
                })}
              </div>
              <b className="memory-title">
                {(() => { const a = story.areas.find(x => x.id === m.areaId); return a ? <StoryIcon icon={a.badge.icon} size={34} className="memory-icon" /> : null })()}
                {personalize(stripLeadingEmoji(m.title), nickname, hero)}
              </b>
              <span className="memory-summary">{personalize(m.summary, nickname, hero)}</span>
            </div>
          ))}
        </div>
      )}

      {step.kind === 'final' && (
        <div className="final">
          <h1>{story.ending.finalMessage}</h1>
          <p>Little Steps: The Guardian's Journey</p>
          <b>THE END</b>
        </div>
      )}

      {soundOpen && <SoundPanel onClose={() => setSoundOpen(false)} />}

      <div className={`dialogue${speakerName ? '' : ' is-narration'}`}>
        {speakerName && <b className={`name name-${line.speaker}`}>{speakerName}</b>}
        <div className="dlg-tools">
          {prefs.speed !== 'instant' && (
            <button className="dlg-tool" onClick={() => setReplay(r => r + 1)} aria-label="อ่านข้อความนี้อีกครั้ง"><ReplayIcon size={34} /> อ่านซ้ำ</button>
          )}
          <button className={`dlg-tool${prefs.auto ? ' on' : ''}`} aria-pressed={prefs.auto}
            onClick={() => setTextPrefs({ auto: !prefs.auto })} aria-label="เล่นบทพูดต่ออัตโนมัติ">
            <AutoPlayIcon size={34} /> {prefs.auto ? 'อัตโนมัติ' : 'อัตโนมัติ: ปิด'}
          </button>
        </div>
        {line.speaker !== 'narrator' && (
          <div className="portrait-frame">
            <img className="portrait" src={faceImage(heroCharId(line.speaker, hero), line.emotion)} alt="" draggable={false} />
          </div>
        )}
        <div className="dialogue-text" onClick={typing ? finishTyping : undefined}>
          <p>
            {lineIcon && <StoryIcon icon={lineIcon} size={46} className="line-icon" />}
            <span className="sr-only">{shownText}</span>
            <span aria-hidden>{chars.slice(0, count).join('')}</span>
            <span className="type-rest" aria-hidden>{chars.slice(count).join('')}</span>
            {!typing && canContinue && step.kind !== 'final' && <span className="next-ind" aria-hidden>▼</span>}
          </p>
        </div>
        <div className="nav">
          <button className="btn btn-back" onClick={onPrev} disabled={!canBack} aria-label="ย้อนกลับ">◀</button>
          <button className="btn btn-primary" onClick={typing ? finishTyping : onNext} disabled={!canContinue && !typing}>
            {step.kind === 'final' ? 'หน้าแรก' : 'ต่อไป ▶'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChoiceGrid({ mission, picked, onPick, label, hero }: { mission: Mission; picked: string | null; onPick: (id: string) => void; label: (s: string) => string; hero: HeroDef }) {
  const solved = mission.choices.some(c => c.id === picked && c.isCorrect)
  const art = (choiceId: string) => choiceArt(mission.missionId, choiceId, hero)
  return (
    <div className="choices choices-2">
      {mission.choices.map(c => (
        <button key={c.id} disabled={solved && !c.isCorrect}
          className={`choice${picked === c.id ? (c.isCorrect ? ' chosen' : ' tried') : ''}`}
          onClick={() => onPick(c.id)} aria-label={`ตัวเลือก ${c.id}: ${label(c.text)}`}>
          <span className="choice-badge">{c.id}</span>
          {art(c.id)
            ? <img className="choice-img" src={art(c.id)!} alt="" draggable={false} />
            : <Placeholder className="choice-img choice-ph" label={`รอภาพประกอบ ${mission.missionId} · ${c.id}`} />}
          <span className="choice-label">{label(c.text)}</span>
        </button>
      ))}
    </div>
  )
}

/** ตั้งค่าความเร็วข้อความ + เล่นอัตโนมัติ (อยู่ในหน้าพัก) */
function TextControls() {
  const prefs = useTextPrefs()
  return (
    <div className="text-controls">
      <span className="text-controls-label">ความเร็วตัวอักษร</span>
      <div className="seg" role="group" aria-label="ความเร็วตัวอักษร">
        {(Object.keys(SPEED_LABEL) as TextSpeed[]).map(s => (
          <button key={s} className={`seg-btn${prefs.speed === s ? ' on' : ''}`} aria-pressed={prefs.speed === s}
            onClick={() => setTextPrefs({ speed: s })}>{SPEED_LABEL[s]}</button>
        ))}
      </div>
    </div>
  )
}
