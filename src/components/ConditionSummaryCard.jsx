// ============================================================================
// ConditionSummaryCard.jsx — Dynamic Condition Summary & Aggregates
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

export default function ConditionSummaryCard() {
  const { conditionSummary, exportCSV, records } = useAssetData()

  return (
    <div className="panel panel-pad fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="section-title">Operating Condition Summary</div>
          <p className="section-sub" style={{ marginBottom: 0 }}>
            Statistical aggregate metrics computed from {records.length} recorded timestamped observations.
          </p>
        </div>
        <button className="btn" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📥</span> Export CSV History
        </button>
      </div>

      <div className="stats-summary-grid">
        <div className="stat-box">
          <div className="stat-label">TEMPERATURE (°C)</div>
          <div className="stat-vals">
            <span>Min: <b>{conditionSummary.minTemp}°C</b></span>
            <span>Avg: <b>{conditionSummary.avgTemp}°C</b></span>
            <span>Max: <b>{conditionSummary.maxTemp}°C</b></span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">VIBRATION (g)</div>
          <div className="stat-vals">
            <span>Min: <b>{conditionSummary.minVib} g</b></span>
            <span>Avg: <b>{conditionSummary.avgVib} g</b></span>
            <span>Max: <b>{conditionSummary.maxVib} g</b></span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">ROTATION SPEED (RPM)</div>
          <div className="stat-vals">
            <span>Min: <b>{conditionSummary.minRpm}</b></span>
            <span>Avg: <b>{conditionSummary.avgRpm}</b></span>
            <span>Max: <b>{conditionSummary.maxRpm}</b></span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">TOTAL ACCUMULATED CYCLES</div>
          <div className="stat-main mono">{conditionSummary.totalCycles.toLocaleString()}</div>
          <div className="stat-sub">Optical pulse cycle count</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">RECORDED OPERATING RUNTIME</div>
          <div className="stat-main mono">{conditionSummary.totalRuntimeFormatted}</div>
          <div className="stat-sub">{conditionSummary.totalRuntime} seconds monitored</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">EVENT COUNTS</div>
          <div className="stat-vals">
            <span style={{ color: 'var(--amber)' }}>Warnings: <b>{conditionSummary.warningsCount}</b></span>
            <span style={{ color: 'var(--red)' }}>Anomalies: <b>{conditionSummary.anomaliesCount}</b></span>
            <span style={{ color: 'var(--accent)' }}>Maint. Flags: <b>{conditionSummary.maintenanceCount}</b></span>
          </div>
        </div>
      </div>
    </div>
  )
}
