// แปลงข้อมูลเนื้อเรื่อง (story.json) เป็นลำดับขั้นตอนเดียวต่อเนื่อง ตั้งแต่เปิดเรื่องจนจบ
import storyData from '../shared/story.json'
import type { Line, Mission, Story } from '../shared/story.types'

export const areaOf = (m: Mission) => story.areas.find(a => a.id === m.area)

export const story = storyData as Story

export type Step =
  | { kind: 'line'; sceneId: string; line: Line }
  | { kind: 'mission'; sceneId: string; mission: Mission }
  | { kind: 'memories'; sceneId: string }
  | { kind: 'final'; sceneId: string }

const lines = (sceneId: string, ls: Line[]): Step[] => ls.map(line => ({ kind: 'line', sceneId, line }))

export function buildSteps(): Step[] {
  const steps: Step[] = []
  for (const b of story.opening) steps.push(...lines(b.sceneId, b.lines))
  for (const area of story.areas) {
    steps.push(...lines(area.intro.sceneId, area.intro.lines))
    for (const id of area.missions) {
      const m = story.missions.find(x => x.missionId === id)
      if (!m) continue
      steps.push(...lines(m.sceneId, m.intro))
      steps.push({ kind: 'mission', sceneId: m.sceneId, mission: m })
      // คำอธิบายความรู้หลังตอบ — ปุยเป็นคนอธิบาย
      steps.push({ kind: 'line', sceneId: m.sceneId, line: { speaker: 'pui', text: `💡 ${m.explanation}`, emotion: 'gentle' } })
      steps.push(...lines(m.sceneId, m.outro))
    }
    steps.push(...lines(area.ending.sceneId, area.ending.lines))
  }
  const [first, ...rest] = story.ending.beats
  if (first) steps.push(...lines(first.sceneId, first.lines))
  steps.push({ kind: 'memories', sceneId: 's12' })
  for (const b of rest) steps.push(...lines(b.sceneId, b.lines))
  steps.push({ kind: 'final', sceneId: 's12' })
  return steps
}
