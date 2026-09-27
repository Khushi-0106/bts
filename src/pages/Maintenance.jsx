// ============================================================================
// Maintenance.jsx — AIoT Machine Maintenance Intelligence
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import MaintenanceCard from '../components/MaintenanceCard.jsx'
import DemoMode from '../components/DemoMode.jsx'

export default function Maintenance() {
  const { asset, health, activeSession } = useAssetData()

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Maintenance Intelligence</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
          {asset.id} · Actionable recommendations driven by real-time sensor health scores and multi-factor baselines.
        </p>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start', marginBottom: 24 }}>
        <MaintenanceCard />
        <DemoMode />
      </div>

      {/* Routine Inspection Checklist */}
      <div className="panel panel-pad">
        <div className="section-title">AIoT Routine Machine Inspection Checklist</div>
        <p className="section-sub">Standard operating procedure checks based on monitored physical parameters.</p>

        <div className="grid grid-3">
          <div className="panel" style={{ padding: '16px', background: 'var(--surface-2)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--accent)' }}>1. Mechanical &amp; Mounting</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Check motor bracket rigidity, tightening torque on mounting screws, and vibration dampening pads.
            </div>
          </div>

          <div className="panel" style={{ padding: '16px', background: 'var(--surface-2)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--amber)' }}>2. Thermal &amp; Bearings</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Inspect DS18B20 contact point, verify adequate ambient airflow, and inspect bearing grease condition.
            </div>
          </div>

          <div className="panel" style={{ padding: '16px', background: 'var(--surface-2)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--green)' }}>3. Electrical &amp; Optical</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Clean optical IR slotted disc, verify MPU6050 I2C pull-ups, and measure motor driver voltage stability.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
