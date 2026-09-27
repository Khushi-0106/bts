import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'
import { useAssetData } from '../context/DataContext.jsx'

const RANGES = ['1H', '6H', '24H', '7D']

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a1e25', border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: '#8b93a1', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{payload[0].value}{unit}</div>
    </div>
  )
}

export default function SensorChart({ paramKey, color = '#7c8cff' }) {
  const { getHistory, assetType, reading } = useAssetData()
  const [range, setRange] = useState('24H')
  const param = assetType.params.find(p => p.key === paramKey)

  const data = useMemo(() => getHistory(paramKey, range), [paramKey, range, reading])

  if (!param) return null
  const latest = reading?.[paramKey]
  const gradId = 'grad-' + paramKey

  return (
    <div className="panel chart-card">
      <div className="chart-header">
        <div className="chart-title-group">
          <span className="chart-title">{param.label}</span>
          <span className="chart-latest mono">{latest}{param.unit}</span>
        </div>
        <div className="range-btns">
          {RANGES.map(r => (
            <button
              key={r}
              className={'range-btn' + (range === r ? ' active' : '')}
              onClick={() => setRange(r)}
            >{r}</button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#565d6b' }} axisLine={false} tickLine={false} minTickGap={30} />
          <YAxis tick={{ fontSize: 10, fill: '#565d6b' }} axisLine={false} tickLine={false} width={38} />
          <Tooltip content={<CustomTooltip unit={param.unit} />} />
          {param.warnAt !== undefined && (
            <ReferenceLine y={param.warnAt} stroke="#f5a93f" strokeDasharray="4 4" strokeWidth={1}
              label={{ value: 'Warning', position: 'insideTopRight', fill: '#f5a93f', fontSize: 9 }} />
          )}
          {param.critAt !== undefined && (
            <ReferenceLine y={param.critAt} stroke="#f1495b" strokeDasharray="4 4" strokeWidth={1}
              label={{ value: 'Critical', position: 'insideTopRight', fill: '#f1495b', fontSize: 9 }} />
          )}
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
