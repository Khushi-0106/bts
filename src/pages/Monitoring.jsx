// ============================================================================
// Monitoring.jsx — Real-Time AIoT Sensor Stream View
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import SensorOverview from '../components/SensorOverview.jsx'
import SensorChart from '../components/SensorChart.jsx'

const CHART_COLORS = {
  temperature: '#f5a93f',
  vibration: '#7c8cff',
  rpm: '#2fd983',
  cycles: '#8b93a1',
  current: '#b98cff',
  voltage: '#38bdf8',
}

export default function Monitoring() {
  const { assetType, asset, reading, statusMeta, health } = useAssetData()
  if (!reading || !health) return null

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Real-Time Sensor Telemetry</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
            {asset.id} · {asset.name} (Operating State: <b style={{ color: `var(--${statusMeta.color})` }}>{health.operatingState}</b>)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="pill pill-green"><span className="pulse-dot" /> STREAMING ACTIVE</span>
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <SensorOverview />
      </div>

      <div className="section-title">Independent Parameter Graphs</div>
      <p className="section-sub">Live streaming charts with dynamic time-range controls.</p>

      <div className="grid grid-2">
        {assetType.params.map(p => (
          <SensorChart key={p.key} paramKey={p.key} color={CHART_COLORS[p.key] || '#7c8cff'} />
        ))}
      </div>
    </div>
  )
}
