import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

export default function BatteryPanel() {
  const { reading, health } = useAssetData()
  if (!reading) return null

  const soc = reading.soc ?? 78
  const color = soc > 50 ? 'var(--green)' : soc > 20 ? 'var(--amber)' : 'var(--red)'

  // Conceptual per-group health, derived from overall SoH with small realistic spread.
  const cellGroups = [0, 1, 2, 3].map(i => Math.max(0, Math.round((reading.soh ?? 91) - i * 1.1)))

  return (
    <div className="panel panel-pad fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="section-title" style={{ marginBottom: 0 }}>EV Battery Condition</span>
        <span className="demo-tag">SIMULATED EV BATTERY DATA</span>
      </div>
      <p className="section-sub" style={{ marginTop: 6 }}>
        Representative data for the platform's EV Battery module. This prototype is not physically connected to an EV battery pack.
      </p>

      <div className="battery-viz">
        <div className="battery-shell">
          <div className="battery-nub" />
          <div className="battery-fill" style={{ width: soc + '%', background: color }} />
        </div>
        <div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 800 }}>{soc}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>State of Charge</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 800 }}>{reading.soh}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>State of Health</div>
        </div>
      </div>

      <div className="cell-row">
        {cellGroups.map((v, i) => (
          <div className="cell-chip" key={i}>
            <div className="cell-val">{v}%</div>
            <div className="cell-label">CELL GROUP {i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
