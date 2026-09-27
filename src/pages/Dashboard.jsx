// ============================================================================
// Dashboard.jsx — MechSight AIoT Condition Intelligence Center
// ============================================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { useAssetData } from '../context/DataContext.jsx'
import HealthScore from '../components/HealthScore.jsx'
import SensorOverview from '../components/SensorOverview.jsx'
import SensorChart from '../components/SensorChart.jsx'
import ConditionSummaryCard from '../components/ConditionSummaryCard.jsx'
import AnomalyPanel from '../components/AnomalyPanel.jsx'
import AlertPanel from '../components/AlertPanel.jsx'
import MaintenanceCard from '../components/MaintenanceCard.jsx'
import DemoMode from '../components/DemoMode.jsx'
import AssetSelector from '../components/AssetSelector.jsx'
import BatteryPanel from '../components/BatteryPanel.jsx'

const CHART_COLORS = {
  temperature: '#f5a93f',
  vibration: '#7c8cff',
  rpm: '#2fd983',
  cycles: '#8b93a1',
  current: '#b98cff',
  voltage: '#38bdf8',
  soh: '#2fd983',
}

export default function Dashboard() {
  const { asset, assetType, health, reading, assetTypeKey, statusMeta, conditionSummary, activeSession } = useAssetData()
  if (!reading || !health) return null

  const chartParams = assetType.params.filter(p => p.weight > 0 || p.isCounter).slice(0, 4)

  return (
    <div className="page-content">
      {/* Title & Status Banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
              Machine Condition Intelligence
            </h1>
            <span className={`pill pill-${statusMeta.color}`} style={{ fontSize: 12 }}>
              <span className="pill-dot" /> {health.operatingState}
            </span>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
            {asset.name} · Physical ESP32 + DS18B20 + MPU6050 + Optical IR telemetry pipeline.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/history" className="btn" style={{ fontSize: 12.5 }}>
            📋 Full History Log
          </Link>
          <Link to="/conditions" className="btn" style={{ fontSize: 12.5 }}>
            📊 Condition Matrix
          </Link>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <div className="panel panel-pad">
          <div className="kv-item">
            <div className="k">MACHINE HEALTH</div>
            <div className="v mono" style={{ fontSize: 28, color: health.score >= 80 ? 'var(--green)' : health.score >= 55 ? 'var(--amber)' : 'var(--red)' }}>
              {health.score}%
            </div>
          </div>
        </div>

        <div className="panel panel-pad">
          <div className="kv-item">
            <div className="k">OPERATING STATE</div>
            <div className="v" style={{ fontSize: 18, color: `var(--${statusMeta.color})`, fontWeight: 800 }}>
              {health.operatingState}
            </div>
          </div>
        </div>

        <div className="panel panel-pad">
          <div className="kv-item">
            <div className="k">TOTAL CYCLES</div>
            <div className="v mono" style={{ fontSize: 24 }}>
              {(reading.cycleCount || reading.cycles || 12480).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="panel panel-pad">
          <div className="kv-item">
            <div className="k">ACTIVE RUNTIME</div>
            <div className="v mono" style={{ fontSize: 24 }}>
              {reading.runtimeFormatted || '01:00:00'}
            </div>
          </div>
        </div>
      </div>

      {/* Health Score Hero */}
      <div style={{ marginBottom: 22 }}>
        <HealthScore />
      </div>

      {/* Live Measurable Operating Conditions */}
      <div style={{ marginBottom: 22 }}>
        <SensorOverview />
      </div>

      {/* Statistical Condition Summary (Min / Avg / Max) */}
      <div style={{ marginBottom: 22 }}>
        <ConditionSummaryCard />
      </div>

      {assetTypeKey === 'ev_battery' && (
        <div style={{ marginBottom: 22 }}>
          <BatteryPanel />
        </div>
      )}

      {/* Independent Condition Graphs */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div className="section-title">Live Sensor Condition Trends</div>
            <p className="section-sub" style={{ marginBottom: 0 }}>
              Continuous time-series telemetry streams with threshold lines.
            </p>
          </div>
          <Link to="/graphs" className="btn" style={{ fontSize: 12 }}>
            View All Graphs →
          </Link>
        </div>
        <div className="grid grid-2" style={{ marginTop: 14 }}>
          {chartParams.map(p => (
            <SensorChart key={p.key} paramKey={p.key} color={CHART_COLORS[p.key] || '#7c8cff'} />
          ))}
        </div>
      </div>

      {/* Anomaly & Demo Panels */}
      <div className="grid grid-2" style={{ marginBottom: 22, alignItems: 'start' }}>
        <AnomalyPanel compact />
        <DemoMode />
      </div>

      {/* Maintenance & Alert Panels */}
      <div className="grid grid-2" style={{ marginBottom: 22, alignItems: 'start' }}>
        <MaintenanceCard />
        <AlertPanel limit={4} />
      </div>

      {/* Fleet Asset Quick Switcher */}
      <AssetSelector />
    </div>
  )
}
