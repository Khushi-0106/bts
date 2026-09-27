// ============================================================================
// AnomalyDetection.jsx — Anomaly Intelligence & Event Log
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import AnomalyPanel from '../components/AnomalyPanel.jsx'

const ROADMAP = [
  { name: 'Baseline-Deviation Anomaly Detection', active: true, note: 'Statistical threshold & baseline tracking across sensors.' },
  { name: 'Explainable Health Scoring', active: true, note: 'Multi-factor weighted health assessment engine.' },
  { name: 'Machine Operating State Tracking', active: true, note: 'Normal, Warning, Abnormal, Maintenance Required transitions.' },
  { name: 'Remaining Useful Life (RUL) Prediction', active: false, note: 'Requires long-horizon historical run-to-failure datasets.' },
  { name: 'ML Fault Classification', active: false, note: 'Requires labeled machine degradation training data.' },
]

export default function AnomalyDetection() {
  const { asset, anomalies } = useAssetData()

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Anomaly Detection &amp; Diagnostics</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
          {asset.id} · Baseline-deviation analysis, explainable anomaly logging, and predictive maintenance roadmap.
        </p>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start', marginBottom: 24 }}>
        <AnomalyPanel />

        <div className="panel panel-pad">
          <div className="section-title">AIoT Predictive Intelligence Roadmap</div>
          <p className="section-sub">Active condition capabilities vs. machine-learning extensions requiring run-to-failure data.</p>
          <div className="predictive-row">
            {ROADMAP.map(r => (
              <div className="predictive-item" key={r.name}>
                <div>
                  <div className="predictive-name">{r.name}</div>
                  {r.note && <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>{r.note}</div>}
                </div>
                <span className="predictive-status" style={{ color: r.active ? 'var(--green)' : 'var(--text-faint)' }}>
                  <span style={{ fontSize: 14 }}>{r.active ? '●' : '○'}</span> {r.active ? 'ACTIVE' : 'ROADMAP'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recorded Anomalies Log */}
      <div className="panel panel-pad">
        <div className="section-title">Recorded Anomaly Events</div>
        <p className="section-sub">Historical log of every statistical deviation detected during operation.</p>

        {anomalies.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-faint)' }}>
            No anomaly events recorded for this machine. Operating within nominal baseline.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {anomalies.map((anom, idx) => (
              <div className="panel" key={anom.id || idx} style={{ padding: '16px', background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{anom.parameter} Deviation</span>
                    <span className={`pill ${anom.severity === 'CRITICAL' ? 'pill-red' : 'pill-amber'}`} style={{ fontSize: 10.5 }}>
                      {anom.severity}
                    </span>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    {new Date(anom.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-3" style={{ marginBottom: 10, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>OBSERVED: </span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--red)' }}>{anom.observedValue}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>EXPECTED RANGE: </span>
                    <span className="mono">{anom.expectedRange}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>DEVIATION: </span>
                    <span className="mono">{anom.deviation}</span>
                  </div>
                </div>

                <div className="pattern-box" style={{ marginTop: 6, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 2 }}>EXPLANATION &amp; RECOMMENDATION</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{anom.explanation}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>Suggested Action: {anom.recommendation}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
