// กราฟ (Chart.js) — แท่งบาง ปลายมน แกนเดียว กริดจาง มีคำอธิบายสี (legend) เมื่อมี ≥2 ชุด และสลับดูเป็นตารางได้ทุกกราฟ
import { useState, type ReactNode } from 'react'
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip, type ChartOptions } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { BarChart3, Table2 } from 'lucide-react'
import { Card, Empty } from './ui'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)
ChartJS.defaults.font.family = "'IBM Plex Sans Thai', system-ui, sans-serif"
ChartJS.defaults.color = '#52514e'

/** ชุดสีมาตรฐาน (ลำดับคงที่ ผ่านการตรวจตาบอดสี) */
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a']

export interface Series { label: string; data: (number | null)[] }

export function BarChart({ title, subtitle, labels, series, unit = '', max, stacked = false, horizontal = false, empty, height = 280 }: {
  title: string; subtitle?: ReactNode; labels: string[]; series: Series[]; unit?: string; max?: number
  stacked?: boolean; horizontal?: boolean; empty?: boolean; height?: number
}) {
  const [asTable, setAsTable] = useState(false)
  const multi = series.length > 1
  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' : 'x',
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: multi, position: 'top', align: 'start', labels: { boxWidth: 12, boxHeight: 12, useBorderRadius: true, borderRadius: 3 } },
      tooltip: {
        backgroundColor: '#fff', titleColor: '#0b0b0b', bodyColor: '#52514e', borderColor: '#e8e3dc', borderWidth: 1, padding: 10,
        callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed[horizontal ? 'x' : 'y'] ?? '—'}${unit}` },
      },
    },
    scales: {
      [horizontal ? 'y' : 'x']: { stacked, grid: { display: false }, border: { color: '#d9d4cc' } },
      [horizontal ? 'x' : 'y']: { stacked, beginAtZero: true, max, grid: { color: '#f0ece6' }, border: { display: false }, ticks: { callback: v => `${v}${unit}` } },
    },
  }
  const data = {
    labels,
    datasets: series.map((s, i) => ({
      label: s.label, data: s.data, backgroundColor: SERIES[i], borderRadius: 4, borderSkipped: 'start' as const,
      maxBarThickness: 28, borderColor: '#fff', borderWidth: stacked ? { top: 2 } : 0,
    })),
  }
  return (
    <Card
      title={<span>{title}{subtitle && <span className="mt-0.5 block text-xs font-normal text-muted">{subtitle}</span>}</span>}
      action={!empty && (
        <button onClick={() => setAsTable(v => !v)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-stone-100" aria-pressed={asTable}>
          {asTable ? <><BarChart3 className="h-4 w-4" /> ดูกราฟ</> : <><Table2 className="h-4 w-4" /> ดูตาราง</>}
        </button>
      )}
    >
      {empty ? <Empty /> : asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted"><tr><th className="py-1 text-left font-medium"> </th>{series.map(s => <th key={s.label} className="py-1 text-right font-medium">{s.label}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {labels.map((l, i) => (
                <tr key={l}><td className="py-1.5">{l}</td>{series.map(s => <td key={s.label} className="py-1.5 text-right tabular-nums">{s.data[i] ?? '—'}{s.data[i] != null ? unit : ''}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height }} role="img" aria-label={title}><Bar options={options} data={data} /></div>
      )}
    </Card>
  )
}
