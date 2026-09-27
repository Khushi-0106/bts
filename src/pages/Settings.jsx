import React, { useState } from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import { REFRESH_INTERVAL_MS } from '../services/sensorService.js'

export default function Settings() {
  const { asset, assetType, demoState, setDemoState, dataSource, setDataSource } = useAssetData()
  const [name, setName] = useState(asset.name)
  const [refresh, setRefresh] = useState(REFRESH_INTERVAL_MS / 1000)

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Settings</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>Configure {asset.id} and how ASSETIQ evaluates it.</p>
      </div>

      <div className="panel panel-pad settings-group">
        <div className="section-title">Asset Identity</div>
        <div className="settings-field">
          <label>Asset name</label>
          <input className="text-input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="settings-field">
          <label>Asset type</label>
          <span className="pill pill-accent">{assetType.label}</span>
        </div>
      </div>

      <div className="panel panel-pad settings-group">
        <div className="section-title">Thresholds</div>
        <p className="section-sub">Warning and critical thresholds per parameter. Adjusting these changes when alerts and the health score react.</p>
        {assetType.params.filter(p => p.warnAt !== undefined).map(p => (
          <div className="settings-field" key={p.key}>
            <div>
              <label>{p.label}</label>
              <div className="hint">Baseline {p.baseline}{p.unit} · Warn {p.warnAt}{p.unit} · Critical {p.critAt}{p.unit}</div>
            </div>
            <input className="text-input" defaultValue={p.warnAt} style={{ width: 90 }} />
          </div>
        ))}
      </div>

      <div className="panel panel-pad settings-group">
        <div className="section-title">Data</div>
        <div className="settings-field">
          <div>
            <label>Data source</label>
            <div className="hint">Switch between simulated demo data and live ESP32 data.</div>
          </div>
          <div
            className="toggle"
            onClick={() => setDataSource(dataSource === 'live' ? 'demo' : 'live')}
          >
            {dataSource === 'live' ? 'LIVE' : 'DEMO'}
            <span className={'toggle-track' + (dataSource === 'live' ? ' on' : '')}><span className="toggle-thumb" /></span>
          </div>
        </div>
        <div className="settings-field">
          <div>
            <label>Demo Mode state</label>
            <div className="hint">Drives simulated readings when data source is Demo Data.</div>
          </div>
          <select className="text-input" value={demoState} onChange={e => setDemoState(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="settings-field">
          <div>
            <label>Data refresh interval</label>
            <div className="hint">How often the dashboard requests a new reading.</div>
          </div>
          <select className="text-input" value={refresh} onChange={e => setRefresh(e.target.value)}>
            <option value="2.5">2.5 seconds</option>
            <option value="5">5 seconds</option>
            <option value="10">10 seconds</option>
          </select>
        </div>
      </div>
    </div>
  )
}
