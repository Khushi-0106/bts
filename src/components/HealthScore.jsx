// ============================================================================
// HealthScore.jsx — Explainable Machine Health & Contributing Factors
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

const COLORS = { green: '#2fd983', amber: '#f5a93f', red: '#f1495b', neutral: '#8b93a1' }

export default function HealthScore() {
  const { health, statusMeta, primaryFactorText, demoState, reading } = useAssetData()
  if (!health) return null

  const radius = 88
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (health.score / 100) * circumference
  const color = COLORS[statusMeta.color] || '#2fd983'

  const trendPct = demoState === 'abnormal' ? -12.4 : demoState === 'warning' ? -4.2 : +1.8
  const trendUp = trendPct >= 0

  return (
    <div className="panel health-hero fade-in">
      <div className="health-ring-wrap">
        <div className="health-ring">
          <svg width="210" height="210" viewBox="0 0 210 210">
            <circle cx="105" cy="105" r={radius} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
            <circle
              cx="105" cy="105" r={radius} fill="none"
              stroke={color} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
            />
          </svg>
          <div className="health-center">
            <div className="health-percent">{health.score}%</div>
            <span className={'pill health-status pill-' + statusMeta.color}>
              <span className="pill-dot" /> {health.operatingState || statusMeta.label}
            </span>
          </div>
        </div>
        <div className="health-trend-note">
          <span style={{ color: trendUp ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
            {trendUp ? '↑' : '↓'} {Math.abs(trendPct)}%
          </span>
          relative to operating baseline
        </div>
      </div>

      <div className="health-why">
        <div className="section-title">Health Score Intelligence &amp; Factors</div>
        <p className="section-sub" style={{ marginBottom: 0 }}>
          Traceable weighted contribution of each monitored sensor parameter relative to baseline.
        </p>

        <div className="factor-list">
          {health.factors.map(f => {
            const fColor = f.value >= 80 ? COLORS.green : f.value >= 55 ? COLORS.amber : COLORS.red
            return (
              <div className="factor-row" key={f.key}>
                <div className="factor-row-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="factor-name">{f.label}</span>
                    <span className="source-badge source-tag-calc" style={{ fontSize: 9.5, padding: '1px 5px' }}>
                      Weight: {f.weightPct}%
                    </span>
                  </div>
                  <span className="factor-value">
                    {f.value}% health · Impact: <b>{f.impact}</b>
                  </span>
                </div>
                <div className="factor-track">
                  <div className="factor-fill" style={{ width: f.value + '%', background: fColor }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="primary-factor-box">
          <span className="primary-factor-label">PRIMARY INFLUENCING CONDITION</span>
          <span className="primary-factor-text">{primaryFactorText}</span>
        </div>
      </div>
    </div>
  )
}
