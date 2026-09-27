import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import MetricCard from './MetricCard.jsx'

function paramStatus(param, value) {
  if (value === undefined || param.warnAt === undefined) return 'normal'
  const higherBetter = param.direction === 'higher_better'
  if (higherBetter) {
    if (value <= param.critAt) return 'critical'
    if (value <= param.warnAt) return 'warning'
    return 'normal'
  }
  if (value >= param.critAt) return 'critical'
  if (value >= param.warnAt) return 'warning'
  return 'normal'
}

export default function SensorOverview() {
  const { assetType, reading, dataSource } = useAssetData()
  if (!reading) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span className="section-title" style={{ marginBottom: 0 }}>Live Sensor Readings</span>
        {dataSource === 'demo' && <span className="demo-tag">DEMO DATA</span>}
      </div>
      <div className="grid grid-4">
        {assetType.params.map(p => {
          const value = reading[p.key]
          if (p.isCounter) {
            return (
              <MetricCard
                key={p.key}
                label={p.label.toUpperCase()}
                value={Math.round(value).toLocaleString()}
                unit={p.unit}
                status="normal"
                trend="+3.2%"
                trendDirection="up"
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
            />
          )
        })}
      </div>
    </div>
  )
}
