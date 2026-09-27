import React from 'react'

// status: 'normal' | 'warning' | 'critical'
export default function MetricCard({ label, value, unit, status = 'normal', trend, trendDirection = 'flat' }) {
  const pillClass = status === 'critical' ? 'pill-red' : status === 'warning' ? 'pill-amber' : 'pill-green'
  const pillText = status === 'critical' ? 'CRITICAL' : status === 'warning' ? 'WARNING' : 'NORMAL'

  return (
    <div className="panel metric-card fade-in">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className={'pill ' + pillClass}>{pillText}</span>
      </div>
      <div className="metric-value-row">
        <span className="metric-value mono">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {trend && (
        <div className="metric-foot">
          <span className={'metric-trend ' + trendDirection}>{trend}</span>
        </div>
      )}
    </div>
  )
}
