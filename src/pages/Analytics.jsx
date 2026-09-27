// ============================================================================
// Analytics.jsx — Fleet Condition Intelligence & Comparison
// ============================================================================

import React, { useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts'
import { useAssetData } from '../context/DataContext.jsx'
import SensorChart from '../components/SensorChart.jsx'
import { computeHealth } from '../utils/healthScore.js'
import { REFERENCE_HEALTH, ASSET_TYPES } from '../data/assetData.js'

function HealthTrendChart() {
  const { assetType, getHistory, health } = useAssetData()
  const scoredParams = assetType.params.filter(p => p.weight > 0)

  const data = useMemo(() => {
    const seriesByParam = {}
    scoredParams.forEach(p => { seriesByParam[p.key] = getHistory(p.key, '24H') })
    const len = seriesByParam[scoredParams[0]?.key]?.length || 0
    const points = []
    for (let i = 0; i < len; i++) {
      const reading = {}
      scoredParams.forEach(p => { reading[p.key] = seriesByParam[p.key][i]?.value })
      const h = computeHealth(assetType, reading)
      points.push({ label: seriesByParam[scoredParams[0].key][i].label, value: h.score })
    }
    return points
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetType])

  return (
    <div className="panel chart-card fade-in">
      <div className="chart-header">
        <div className="chart-title-group">
          <span className="chart-title">Health Score Historical Evolution</span>
          <span className="chart-latest mono">{health?.score}%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-health" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2fd983" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2fd983" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#565d6b' }} axisLine={false} tickLine={false} minTickGap={30} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#565d6b' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip contentStyle={{ background: '#14171d', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey="value" stroke="#2fd983" strokeWidth={2} fill="url(#grad-health)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ComparisonChart() {
  const { assets, assetId, health } = useAssetData()
  const data = assets.map(a => ({
    name: ASSET_TYPES[a.type].short,
    id: a.id,
    value: a.id === assetId && health ? health.score : REFERENCE_HEALTH[a.id],
  }))

  const colorFor = (v) => (v >= 80 ? '#2fd983' : v >= 55 ? '#f5a93f' : '#f1495b')

  return (
    <div className="panel panel-pad fade-in">
      <div className="section-title">Fleet Machine Health Comparison</div>
      <p className="section-sub">
        Normalized condition scores across testbed and fleet assets. Physical testbed active on AST-IND-001.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8b93a1' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#565d6b' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip contentStyle={{ background: '#14171d', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={colorFor(d.value)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Analytics() {
  const { reading } = useAssetData()
  if (!reading) return null

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Analytics &amp; Fleet Intelligence</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
          Longitudinal trend intelligence and cross-asset baseline comparison.
        </p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 22 }}>
        <HealthTrendChart />
        <SensorChart paramKey="temperature" color="#f5a93f" />
        <SensorChart paramKey="vibration" color="#7c8cff" />
        <SensorChart paramKey="rpm" color="#2fd983" title="Rotation Speed" unitOverride="RPM" />
      </div>

      <ComparisonChart />
    </div>
  )
}
