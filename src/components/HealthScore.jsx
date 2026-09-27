import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

const COLORS = { green: '#2fd983', amber: '#f5a93f', red: '#f1495b' }

export default function HealthScore() {
  const { health, statusMeta, primaryFactorText, demoState } = useAssetData()
  if (!health) return null

  const radius = 88
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (health.score / 100) * circumference
  const color = COLORS[statusMeta.color]

  const trendPct = demoState === 'critical' ? -8.6 : demoState === 'warning' ? -3.1 : 2.4
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
            <span className={'pill health-status pill-' + statusMeta.color}>{statusMeta.label}</span>
          </div>
        </div>
        <div className="health-trend-note">
          <span style={{ color: trendUp ? 'var(--green)' : 'var(--red)' }}>
            {trendUp ? '↑' : '↓'} {Math.abs(trendPct)}%
          </span>
          vs previous period
        </div>
      </div>

      <div className="health-why">
        <div className="section-title">Why is the score {health.score}%?</div>
        <p className="section-sub" style={{ marginBottom: 0 }}>Weighted contribution of each monitored parameter, relative to this asset's baseline.</p>

        <div className="factor-list">
          {health.factors.map(f => {
            const fColor = f.value >= 80 ? COLORS.green : f.value >= 55 ? COLORS.amber : COLORS.red
            return (
              <div className="factor-row" key={f.key}>
                <div className="factor-row-top">
                  <span className="factor-name">{f.label}</span>
                  <span className="factor-value">{f.value}% · Impact: {f.impact}</span>
                </div>
                <div className="factor-track">
                  <div className="factor-fill" style={{ width: f.value + '%', background: fColor }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="primary-factor-box">
          <span className="primary-factor-label">PRIMARY HEALTH FACTOR</span>
          <span className="primary-factor-text">{primaryFactorText}</span>
        </div>
      </div>
    </div>
  )
}
