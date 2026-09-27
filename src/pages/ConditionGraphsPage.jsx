// ============================================================================
// ConditionGraphsPage.jsx — Independent Multi-Parameter Condition Graphs
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import SensorChart from '../components/SensorChart.jsx'

export default function ConditionGraphsPage() {
  const { asset, assetType, reading } = useAssetData()
  if (!reading) return null

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          Condition Graphs &amp; Historical Trends
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
          {asset.id} · Independent multi-channel time-series graphs for every monitored machine parameter.
        </p>
      </div>

      <div className="grid grid-2">
        {/* 1. Temperature */}
        <SensorChart paramKey="temperature" color="#f5a93f" />

        {/* 2. Vibration */}
        <SensorChart paramKey="vibration" color="#7c8cff" />

        {/* 3. RPM / Rotation */}
        <SensorChart paramKey="rpm" color="#2fd983" title="Rotation Speed" unitOverride="RPM" />

        {/* 4. Cycle Count */}
        <SensorChart paramKey="cycles" color="#8b93a1" title="Operating Cycles" unitOverride="revs" />

        {/* 5. Current */}
        <SensorChart paramKey="current" color="#b98cff" title="Motor Current" unitOverride="A" />

        {/* 6. Voltage */}
        <SensorChart paramKey="voltage" color="#38bdf8" title="Operating Voltage" unitOverride="V" />
      </div>
    </div>
  )
}
