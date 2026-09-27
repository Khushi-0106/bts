import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import AnomalyPanel from '../components/AnomalyPanel.jsx'

const ROADMAP = [
  { name: 'Anomaly Detection', active: true },
  { name: 'Health Scoring', active: true },
  { name: 'Remaining Useful Life', active: false, note: 'Requires historical run-to-failure data.' },
  { name: 'Failure Prediction', active: false, note: 'Requires labeled failure history for training.' },
  { name: 'Degradation Modeling', active: false, note: 'Requires long-horizon sensor history per asset.' },
]

export default function AnomalyDetection() {
  const { asset } = useAssetData()

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Anomaly Detection</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>{asset.id} · baseline-deviation analysis, not a confirmed failure diagnosis.</p>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <AnomalyPanel />

        <div className="panel panel-pad">
          <div className="section-title">Predictive Intelligence</div>
          <p className="section-sub">What ASSETIQ can do today, and what requires more historical data.</p>
          <div className="predictive-row">
            {ROADMAP.map(r => (
              <div className="predictive-item" key={r.name}>
                <div>
                  <div className="predictive-name">{r.name}</div>
                  {r.note && <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>{r.note}</div>}
                </div>
                <span className="predictive-status" style={{ color: r.active ? 'var(--green)' : 'var(--text-faint)' }}>
                  <span style={{ fontSize: 14 }}>{r.active ? '●' : '○'}</span> {r.active ? 'ACTIVE' : 'FUTURE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
