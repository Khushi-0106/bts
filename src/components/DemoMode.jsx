import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

const OPTIONS = [
  { key: 'normal', label: 'NORMAL', cls: 'ok' },
  { key: 'warning', label: 'WARNING', cls: 'warn' },
  { key: 'critical', label: 'CRITICAL', cls: 'crit' },
]

export default function DemoMode() {
  const { demoState, setDemoState } = useAssetData()

  return (
    <div className="panel demo-mode-card fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="section-title" style={{ marginBottom: 0 }}>Demo Mode</span>
        <span className="demo-tag">SOFTWARE-SIMULATED VALUES</span>
      </div>
      <p className="section-sub" style={{ marginTop: 6 }}>
        Drives every panel on this dashboard — sensors, health score, anomaly score, alerts and maintenance
        recommendations — from a single simulated state. Nothing here can physically overheat or damage the
        connected hardware.
      </p>

      <div className="demo-btn-row">
        {OPTIONS.map(o => (
          <button
            key={o.key}
            className={'btn demo-btn' + (demoState === o.key ? ' btn-active ' + o.cls : '')}
            onClick={() => setDemoState(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
