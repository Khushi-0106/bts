import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

export default function Header() {
  const { assetId, setAssetId, assets, dataSource, setDataSource } = useAssetData()

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">Asset Health Intelligence</div>
        <div className="topbar-sub">Continuous condition monitoring &amp; predictive maintenance</div>
      </div>

      <div className="topbar-right">
        <div className="asset-select">
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            {assets.map(a => (
              <option key={a.id} value={a.id}>{a.id} — {a.name.split(' — ')[0]}</option>
            ))}
          </select>
        </div>

        <div className="pill pill-green">
          <span className="pill-dot" /> LIVE
        </div>

        <div
          className="toggle"
          onClick={() => setDataSource(dataSource === 'live' ? 'demo' : 'live')}
          title="Toggle between simulated demo data and live ESP32 data"
        >
          {dataSource === 'live' ? 'LIVE SENSOR DATA' : 'DEMO DATA'}
          <span className={'toggle-track' + (dataSource === 'live' ? ' on' : '')}>
            <span className="toggle-thumb" />
          </span>
        </div>

        <div className="icon-btn" title="Notifications">🔔</div>
      </div>
    </header>
  )
}
