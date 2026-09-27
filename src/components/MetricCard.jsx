// ============================================================================
// MetricCard.jsx — Industrial Sensor Parameter Card
// ============================================================================

import React from 'react'

export default function MetricCard({
  label,
  value,
  unit,
  status = 'normal',
  sourceType = 'REAL SENSOR',
  sensorHardware,
  normalRange,
  trend,
  trendDirection = 'flat',
  subtitle,
}) {
  const normStatus = status.toLowerCase()
  const pillClass = normStatus === 'critical' || normStatus === 'maintenance required' 
    ? 'pill-red' 
    : normStatus === 'warning' || normStatus === 'abnormal'
    ? 'pill-amber' 
    : 'pill-green'

  const pillText = status.toUpperCase()

  const sourceClass = sourceType.includes('REAL') 
    ? 'source-tag-real' 
    : sourceType.includes('CALC') 
    ? 'source-tag-calc' 
    : 'source-tag-sim'

  return (
    <div className="panel metric-card fade-in">
      <div className="metric-top">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="metric-label">{label}</span>
          {sensorHardware && (
            <span className="sensor-hardware-tag">{sensorHardware}</span>
          )}
        </div>
        <span className={'pill ' + pillClass}>{pillText}</span>
      </div>

      <div className="metric-value-row">
        <span className="metric-value mono">{value !== undefined ? value : '—'}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>

      <div className="metric-foot">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {normalRange && (
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Normal: {normalRange}</span>
          )}
          {subtitle && (
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{subtitle}</span>
          )}
        </div>
        <span className={`source-badge ${sourceClass}`}>{sourceType}</span>
      </div>
    </div>
  )
}
