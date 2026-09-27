// ============================================================================
// Header.jsx — MechSight Top Command Bar
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

export default function Header() {
  const { assetId, setAssetId, assets, dataSource, setDataSource, statusMeta, asset } = useAssetData()

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">MechSight — Machine Condition Intelligence</div>
        <div className="topbar-sub">Real-Time AIoT Physical Prototype Monitoring &amp; Condition Recording</div>
      </div>

      <div className="topbar-right">
        <div className="asset-select">
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            {assets.map(a => (
              <option key={a.id} value={a.id}>{a.id} — {a.name.split(' — ')[0]}</option>
            ))}
          </select>
        </div>

        <div className={`pill pill-${statusMeta.color}`}>
          <span className="pill-dot" /> {statusMeta.label}
        </div>

        <div
          className="toggle"
          onClick={() => setDataSource(dataSource === 'live' ? 'demo' : 'live')}
          title="Toggle between Live ESP32 Hardware Data and Demo Mode"
        >
          {dataSource === 'live' ? 'LIVE HARDWARE DATA' : 'DEMO MODE'}
          <span className={'toggle-track' + (dataSource === 'live' ? ' on' : '')}>
            <span className="toggle-thumb" />
          </span>
        </div>
      </div>
    </header>
  )
}
