import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Stage } from './game/Stage'
import { RotateGate, enterLandscapeFullscreen } from './game/RotateGate'
import { Placeholder } from './game/Placeholder'
import { SCENES, CHARACTER_NAMES } from './shared/scenes'
import { areaOf, buildSteps, story, type Step } from './game/storyFlow'
import type { Line, Mission } from './shared/story.types'
import { bodyImage, bustImage, faceImage } from './shared/characters'
import { HowToScreen, LoadingScreen, NicknameScreen, TitleScreen, type SoundSettings } from './game/StartScreens'
import { createSession, endSession, startTracking, track, withNickname, type PlayerSession } from './game/player'

type Screen = 'title' | 'nickname' | 'howto' | 'loading' | 'game'

export default function App() {
  const steps = useMemo(buildSteps, [])
  const [screen, setScreen] = useState<Screen>('title')
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [sound, setSound] = useState<SoundSettings>({ music: true, voice: true })
  const [session, setSession] = useState<PlayerSession | null>(null)
  const [draftName, setDraftName] = useState('')

  const openNickname = async () => {
    await enterLandscapeFullscreen()
    setScreen('nickname')
  }

  const begin = (nickname: string) => {
    const s = createSession(nickname)
    setSession(s)
    startTracking(s, { musicOn: sound.music, voiceOn: sound.voice })
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
        {screen === 'title' && <TitleScreen sound={sound} onSound={setSound} onStart={openNickname} />}
        {screen === 'nickname' && (
          <NicknameScreen sound={sound} onSound={setSound} name={draftName} setName={setDraftName}
            onStart={begin} onHowTo={() => setScreen('howto')} onBack={() => setScreen('title')} />
        )}
        {screen === 'howto' && <HowToScreen onBack={() => setScreen('nickname')} />}
        {screen === 'loading' && <LoadingScreen nickname={session?.nickname ?? ''} onDone={toGame} />}
        {screen === 'game' && (
          <StepView
            key={idx}
            step={steps[idx]}
            nickname={session?.nickname ?? ''}
            prevSpeaker={idx > 0 && steps[idx - 1].kind === 'line' ? (steps[idx - 1] as { line: Line }).line.speaker : null}
            canBack={idx > 0}
            onNext={next}
            onPrev={() => setIdx(Math.max(idx - 1, 0))}
            onPause={() => { setPaused(true); track({ type: 'pause' }) }}
          />
        )}
        {paused && (
          <div className="overlay">
            <div className="panel">
              <h2>พักก่อนนะ</h2>
              <button className="btn btn-primary" onClick={() => { setPaused(false); track({ type: 'resume' }) }}>เล่นต่อ</button>
              <button className="btn" onClick={goHome}>กลับหน้าแรก</button>
            </div>
          </div>
        )}
      </Stage>
    </RotateGate>
  )
}

interface StepProps { step: Step; nickname: string; prevSpeaker: string | null; canBack: boolean; onNext: () => void; onPrev: () => void; onPause: () => void }

function StepView({ step, nickname, prevSpeaker, canBack, onNext, onPrev, onPause }: StepProps) {
  const scene = SCENES.find(s => s.id === step.sceneId) ?? SCENES[0]
  const mission = step.kind === 'mission' ? step.mission : null
  const [hintLevel, setHintLevel] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const attempts = useRef(0)
  const [assisted, setAssisted] = useState(false)
  const markAssisted = () => {
    if (!mission || assisted) return
    setAssisted(true)
    track({ type: 'assist', missionId: mission.missionId })
  }
  const shownAt = useRef(Date.now())

  const pick = (id: string) => {
    if (!mission) return
    const c = mission.choices.find(x => x.id === id)!
    attempts.current += 1
    track({ type: 'answer', missionId: mission.missionId, choiceId: c.id, isCorrect: c.isCorrect, attempt: attempts.current,
      responseMs: Date.now() - shownAt.current, hintsUsed: hintLevel, caregiverAssisted: assisted })
    setPicked(id)
  }

  // ข้อความในกล่องบทสนทนาของขั้นตอนนี้
  let line: Line
  let canContinue = true
  if (step.kind === 'line') line = step.line
  else if (step.kind === 'mission') {
    const choice = step.mission.choices.find(c => c.id === picked)
    if (choice) line = { speaker: 'pui', text: choice.feedback, emotion: choice.isCorrect ? 'happy' : 'gentle' }
    else if (hintLevel > 0) line = { speaker: 'pui', text: `💡 ${step.mission.hints[hintLevel - 1]}` }
    else line = step.mission.question
    canContinue = !!choice?.isCorrect
  } else if (step.kind === 'memories') line = { speaker: 'narrator', text: 'ความทรงจำจากการเดินทางวันนี้' }
  else line = { speaker: 'narrator', text: story.ending.finalMessage }

  const hasPanel = step.kind !== 'line'
  const charsHidden = line.speaker !== 'narrator' || step.kind === 'memories'
  const prevHidden = prevSpeaker !== null && prevSpeaker !== 'narrator'
  const speakerName = line.speaker === 'narrator' ? '' : CHARACTER_NAMES[line.speaker]
  const showHint = () => {
    if (!mission) return
    const level = Math.min(hintLevel + 1, mission.hints.length)
    track({ type: 'hint', missionId: mission.missionId, level })
    setHintLevel(level)
  }

  return (
    <div className="scene">
      {scene.bg
        ? <img className="bg" src={scene.bg} alt={scene.title} draggable={false} />
        : <Placeholder label={`พื้นหลัง: ${scene.title}`} className="bg" />}

      <div className="hud-top">
        <span className="chip">{mission ? `${areaOf(mission)?.name} · ${mission.missionId} ${mission.title}` : `${scene.location} · ${scene.title}`}</span>
        <div className="hud-btns">
          <button className="icon-btn" aria-label="ฟังเสียงอีกครั้ง">🔊</button>
          {step.kind === 'mission' && <button className="icon-btn" aria-label="คำใบ้" onClick={showHint}>💡</button>}
          {step.kind === 'mission' && (
            <button className={`icon-btn assist-btn${assisted ? ' on' : ''}`} onClick={markAssisted} aria-pressed={assisted}
              aria-label="ผู้ดูแลช่วย (กดเมื่อผู้ดูแลช่วยอธิบายหรือช่วยเลือก)" title="ผู้ดูแลช่วย">🤝</button>
          )}
          <button className="icon-btn" aria-label="หยุดพัก" onClick={onPause}>⏸</button>
        </div>
      </div>

      {/* ตัวละครยืนในฉาก — วางบนพื้นเดียวกัน ผู้ใหญ่หันหน้าเข้าหามะลิ */}
      {/* มีคนพูด → ซ่อนตัวละครที่ยืนในฉาก ให้เหลือแค่ภาพผู้พูดด้านขวา / ผู้บรรยาย → แสดงตัวละครในฉาก */}
      <div className={`characters${charsHidden ? ' hidden' : ''}${charsHidden !== prevHidden ? (charsHidden ? ' fade-out' : ' fade-in') : ''}`}>
        {scene.characters.map(c => (
          <div key={c} className={`slot slot-${c}${line.speaker === c ? ' speaking' : ''}${line.speaker !== 'narrator' && line.speaker !== c ? ' listening' : ''}`}>
            <img src={bodyImage(c)} alt={CHARACTER_NAMES[c]} draggable={false} className={`char char-${c}`} />
          </div>
        ))}
      </div>

      {/* ภาพครึ่งตัวของผู้พูด แสดงข้างกล่องบทสนทนา */}
      {/* ไม่แสดงตอนมีตัวเลือก เพื่อไม่ให้บังรูปตัวเลือก — ใช้รูปหน้าเล็กในกล่องแทน */}
      {line.speaker !== 'narrator' && !hasPanel && (() => {
        const b = bustImage(line.speaker, line.emotion)
        return (
          <div className={`bust${line.speaker !== prevSpeaker ? ' enter' : ''}`} aria-hidden>
            <img key={b.key} src={b.src} alt="" draggable={false} style={{ width: b.width, top: b.top }} />
          </div>
        )
      })()}

      {step.kind === 'mission' && <ChoiceGrid mission={step.mission} picked={picked} onPick={pick} />}


      {step.kind === 'memories' && (
        <div className="choices choices-wrap">
          {story.ending.memories.map(m => (
            <div key={m.areaId} className="choice small memory">
              <Placeholder label={`ความทรงจำ: ${m.title}`} />
              <span className="choice-label">{m.summary}</span>
            </div>
          ))}
        </div>
      )}

      {step.kind === 'final' && (
        <div className="final">
          <h1>{story.ending.finalMessage}</h1>
          <p>Little Steps: My Health Journey</p>
          <b>THE END</b>
        </div>
      )}

      <div className="dialogue">
        {hasPanel && line.speaker !== 'narrator' && (
          <img className="portrait" src={faceImage(line.speaker, line.emotion)} alt="" draggable={false} />
        )}
        <div className={`dialogue-text${speakerName ? '' : ' narration'}`}>
          {speakerName && <b className={`name name-${line.speaker}`}>{speakerName}</b>}
          <p>{withNickname(line.text, nickname)}</p>
        </div>
        <div className="nav">
          <button className="btn" onClick={onPrev} disabled={!canBack} aria-label="ย้อนกลับ">◀</button>
          <button className="btn btn-primary" onClick={onNext} disabled={!canContinue}>
            {step.kind === 'final' ? 'หน้าแรก' : 'ต่อไป ▶'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChoiceGrid({ mission, picked, onPick }: { mission: Mission; picked: string | null; onPick: (id: string) => void }) {
  const solved = mission.choices.some(c => c.id === picked && c.isCorrect)
  return (
    <div className="choices choices-2">
      {mission.choices.map(c => (
        <button key={c.id} disabled={solved && !c.isCorrect}
          className={`choice${picked === c.id ? (c.isCorrect ? ' chosen' : ' tried') : ''}`}
          onClick={() => onPick(c.id)} aria-label={`ตัวเลือก ${c.id}: ${c.text}`}>
          <span className="choice-badge">{c.id}</span>
          <img className="choice-img" src={c.image} alt="" draggable={false} />
          <span className="choice-label">{c.text}</span>
        </button>
      ))}
    </div>
  )
}
