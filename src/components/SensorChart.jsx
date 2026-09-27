// ============================================================================
// SensorChart.jsx — Responsive Historical Condition Graph
// ============================================================================

import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'
import { useAssetData } from '../context/DataContext.jsx'

const RANGES = ['Live', '1H', '6H', '24H', '7D']

function CustomTooltip({ active, payload, label, unit, paramName }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#14171d', border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: '#8b93a1', fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#eef1f5', fontWeight: 600 }}>{paramName}:</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
          {payload[0].value} {unit}
        </span>
      </div>
    </div>
  )
}

export default function SensorChart({ paramKey, color = '#7c8cff', title, unitOverride }) {
  const { getHistory, assetType, reading } = useAssetData()
  const [range, setRange] = useState('24H')
  
  const param = assetType.params.find(p => p.key === paramKey) || {
    key: paramKey,
    label: title || paramKey,
    unit: unitOverride || '',
  }

  const data = useMemo(() => getHistory(paramKey, range), [paramKey, range, reading, getHistory])

  const latest = reading?.[paramKey] !== undefined ? reading[paramKey] : (data[data.length - 1]?.value)
  const gradId = 'grad-' + paramKey

  return (
    <div className="panel chart-card fade-in">
      <div className="chart-header">
        <div className="chart-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="chart-title">{param.label}</span>
            {param.sourceType && (
              <span className="source-badge source-tag-real" style={{ fontSize: 9.5 }}>
                {param.sourceType}
              </span>
            )}
          </div>
          <span className="chart-latest mono">
            {latest !== undefined ? latest : '—'} {param.unit}
          </span>
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

      {data.length === 0 ? (
        <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
          No recorded condition points available for selected range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#565d6b' }} axisLine={false} tickLine={false} minTickGap={25} />
            <YAxis tick={{ fontSize: 10, fill: '#565d6b' }} axisLine={false} tickLine={false} width={38} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip unit={param.unit} paramName={param.label} />} />
            {param.warnAt !== undefined && (
              <ReferenceLine y={param.warnAt} stroke="#f5a93f" strokeDasharray="4 4" strokeWidth={1}
                label={{ value: 'Warn', position: 'insideTopRight', fill: '#f5a93f', fontSize: 9 }} />
            )}
            {param.critAt !== undefined && (
              <ReferenceLine y={param.critAt} stroke="#f1495b" strokeDasharray="4 4" strokeWidth={1}
                label={{ value: 'Crit', position: 'insideTopRight', fill: '#f1495b', fontSize: 9 }} />
            )}
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
