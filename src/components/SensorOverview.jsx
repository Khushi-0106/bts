// ============================================================================
// SensorOverview.jsx — Live Monitored Operating Parameters
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import MetricCard from './MetricCard.jsx'

function paramStatus(param, value) {
  if (value === undefined || value === null || param.warnAt === undefined) return 'NORMAL'
  const higherBetter = param.direction === 'higher_better'
  if (higherBetter) {
    if (value <= param.critAt) return 'CRITICAL'
    if (value <= param.warnAt) return 'WARNING'
    return 'NORMAL'
  }
  if (value >= param.critAt) return 'CRITICAL'
  if (value >= param.warnAt) return 'WARNING'
  return 'NORMAL'
}

export default function SensorOverview() {
  const { assetType, reading, dataSource, assetTypeKey } = useAssetData()
  if (!reading) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="section-title" style={{ marginBottom: 0 }}>Live Machine Operating Conditions</span>
          {dataSource === 'demo' ? (
            <span className="demo-tag">DEMO MODE ACTIVE</span>
          ) : (
            <span className="live-tag">● HARDWARE TELEMETRY ACTIVE</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          Updated: {new Date(reading.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-3">
        {assetType.params.map(p => {
          const value = reading[p.key]
          const isCounter = p.isCounter

          if (isCounter) {
            return (
              <MetricCard
                key={p.key}
                label={p.label.toUpperCase()}
                value={Math.round(value).toLocaleString()}
                unit={p.unit}
                status="NORMAL"
                sourceType={dataSource === 'live' ? (p.sourceType || 'REAL SENSOR') : 'SIMULATED'}
                sensorHardware={p.sensorHardware}
                normalRange={p.normalRange}
                subtitle="Monotonically Accumulated"
              />
            )
          }

          const status = paramStatus(p, value)
          return (
            <MetricCard
              key={p.key}
              label={p.label.toUpperCase()}
              value={value}
              unit={p.unit}
              status={status}
              sourceType={dataSource === 'live' ? (p.sourceType || 'REAL SENSOR') : 'SIMULATED'}
              sensorHardware={p.sensorHardware}
              normalRange={p.normalRange}
            />
          )
        })}
      </div>
    </div>
  )
}
