import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import SensorOverview from '../components/SensorOverview.jsx'
import SensorChart from '../components/SensorChart.jsx'

const CHART_COLORS = { temperature: '#f5a93f', vibration: '#7c8cff', current: '#b98cff', voltage: '#2fd983', soh: '#2fd983', cycles: '#8b93a1' }

export default function Monitoring() {
  const { assetType, asset, reading } = useAssetData()
  if (!reading) return null
  const chartParams = assetType.params.filter(p => p.weight > 0 || p.isCounter)

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Live Monitoring</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>{asset.id} · {assetType.label}</p>
        </div>
        <span className="pill pill-green"><span className="pill-dot" /> STREAMING</span>
      </div>

      <div style={{ marginBottom: 22 }}>
        <SensorOverview />
      </div>

      <div className="grid grid-2">
        {chartParams.map(p => (
          <SensorChart key={p.key} paramKey={p.key} color={CHART_COLORS[p.key] || '#7c8cff'} />
        ))}
      </div>
    </div>
  )
}
