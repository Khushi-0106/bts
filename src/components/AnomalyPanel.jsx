import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

const STATUS_COLOR = { NORMAL: 'green', ELEVATED: 'amber', CRITICAL: 'red' }

export default function AnomalyPanel({ compact = false }) {
  const { anomaly, anomalyText } = useAssetData()
  if (!anomaly) return null
  const colorKey = STATUS_COLOR[anomaly.status]
  const color = `var(--${colorKey})`

  return (
    <div className="panel panel-pad fade-in">
      <div className="section-title">AI-Assisted Anomaly Detection</div>
      <p className="section-sub">Statistical deviation from this asset's recent operating baseline.</p>

      <div className="anomaly-top">
        <div className="anomaly-score-circle" style={{ borderColor: color }}>
          <div className="anomaly-score-num" style={{ color }}>{anomaly.score}</div>
        </div>
        <div>
          <div className={'pill pill-' + colorKey}><span className="pill-dot" /> {anomaly.status}</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>Anomaly score, out of 100</div>
        </div>
      </div>

      {!compact && (
        <>
          <div className="check-list">
            {anomaly.checks.map(c => (
              <div className={'check-item' + (!c.pass ? ' fail-text' : '')} key={c.key}>
                <span className={'check-icon ' + (c.pass ? 'pass' : 'fail')}>{c.pass ? '✓' : '!'}</span>
                {c.label} {c.pass ? 'within baseline' : 'trending outside baseline'}
              </div>
            ))}
          </div>

          <div className="pattern-box">
            <div className="pattern-title">PATTERN ANALYSIS</div>
            <div className="pattern-text">{anomalyText}</div>
          </div>
        </>
      )}
    </div>
  )
}
