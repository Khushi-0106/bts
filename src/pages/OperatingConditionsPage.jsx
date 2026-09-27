// ============================================================================
// OperatingConditionsPage.jsx — Detailed Measurable Machine Parameters
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import SensorChart from '../components/SensorChart.jsx'

export default function OperatingConditionsPage() {
  const { asset, assetType, reading, conditionSummary, dataSource } = useAssetData()
  if (!reading) return null

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          Measurable Operating Conditions
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
          {asset.id} · Comprehensive condition matrix with thresholds, observed statistical ranges, and sensor provenance.
        </p>
      </div>

      {/* Conditions Table */}
      <div className="panel panel-pad" style={{ marginBottom: 24 }}>
        <div className="section-title">Condition Matrix &amp; Thresholds</div>
        <p className="section-sub">
          All monitored parameters evaluated against established engineering thresholds and physical sensor telemetry.
        </p>

        <div className="conditions-grid">
          {assetType.params.map(p => {
            const currentVal = reading[p.key]
            const isCounter = p.isCounter
            let status = 'NORMAL'
            if (p.critAt !== undefined) {
              if (p.direction === 'higher_better' ? currentVal <= p.critAt : currentVal >= p.critAt) {
                status = 'CRITICAL'
              } else if (p.warnAt !== undefined && (p.direction === 'higher_better' ? currentVal <= p.warnAt : currentVal >= p.warnAt)) {
                status = 'WARNING'
              }
            }

            const statusClass = status === 'CRITICAL' ? 'pill-red' : status === 'WARNING' ? 'pill-amber' : 'pill-green'
            const sourceClass = (p.sourceType || '').includes('REAL') ? 'source-tag-real' : (p.sourceType || '').includes('CALC') ? 'source-tag-calc' : 'source-tag-sim'

            // Dynamic min/max/avg from summary if available
            let minObs = p.minObserved || p.baseline * 0.8
            let maxObs = p.maxObserved || (p.critAt || p.baseline * 1.3)
            let avgObs = p.baseline

            if (p.key === 'temperature') {
              minObs = conditionSummary.minTemp
              maxObs = conditionSummary.maxTemp
              avgObs = conditionSummary.avgTemp
            } else if (p.key === 'vibration') {
              minObs = conditionSummary.minVib
              maxObs = conditionSummary.maxVib
              avgObs = conditionSummary.avgVib
            } else if (p.key === 'rpm') {
              minObs = conditionSummary.minRpm
              maxObs = conditionSummary.maxRpm
              avgObs = conditionSummary.avgRpm
            }

            return (
              <div className="panel condition-box fade-in" key={p.key}>
                <div className="condition-box-header">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.label}</div>
                    {p.sensorHardware && (
                      <div className="sensor-hardware-tag" style={{ marginTop: 2 }}>{p.sensorHardware}</div>
                    )}
                  </div>
                  <span className={'pill ' + statusClass} style={{ fontSize: 11 }}>{status}</span>
                </div>

                <div className="condition-main-val">
                  <span className="mono" style={{ fontSize: 32, fontWeight: 800 }}>
                    {isCounter ? Math.round(currentVal).toLocaleString() : currentVal}
                  </span>
                  {p.unit && <span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 600 }}>{p.unit}</span>}
                </div>

                <div className="condition-stats-rows">
                  <div className="c-stat-row">
                    <span className="c-k">Normal Range:</span>
                    <span className="c-v">{p.normalRange || `${p.baseline} ${p.unit}`}</span>
                  </div>
                  {p.warnAt !== undefined && (
                    <div className="c-stat-row">
                      <span className="c-k">Warning Threshold:</span>
                      <span className="c-v" style={{ color: 'var(--amber)' }}>{p.warnAt} {p.unit}</span>
                    </div>
                  )}
                  {p.critAt !== undefined && (
                    <div className="c-stat-row">
                      <span className="c-k">Critical Threshold:</span>
                      <span className="c-v" style={{ color: 'var(--red)' }}>{p.critAt} {p.unit}</span>
                    </div>
                  )}
                  {!isCounter && (
                    <div className="c-stat-row" style={{ borderTop: '1px dashed var(--border)', paddingTop: 6, marginTop: 4 }}>
                      <span className="c-k">Observed (Min / Avg / Max):</span>
                      <span className="c-v mono">{minObs} / {avgObs} / {maxObs} {p.unit}</span>
                    </div>
                  )}
                </div>

                <div className="condition-box-footer">
                  <span className={`source-badge ${sourceClass}`}>
                    {dataSource === 'live' ? (p.sourceType || 'REAL SENSOR') : 'SIMULATED'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    Weight: {Math.round(p.weight * 100)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Individual Condition Trend Graphs */}
      <div>
        <div className="section-title">Individual Condition Graphs</div>
        <p className="section-sub">Independent time-series analysis for each measurable condition.</p>
        <div className="grid grid-2">
          {assetType.params.map(p => (
            <SensorChart key={p.key} paramKey={p.key} color={p.key === 'temperature' ? '#f5a93f' : p.key === 'vibration' ? '#7c8cff' : p.key === 'rpm' ? '#2fd983' : '#b98cff'} />
          ))}
        </div>
      </div>
    </div>
  )
}
