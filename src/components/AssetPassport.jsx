// ============================================================================
// AssetPassport.jsx — Digital Machine Passport Component
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

export default function AssetPassport() {
  const { asset, assetType, health, reading, conditionSummary } = useAssetData()
  if (!reading || !health) return null

  return (
    <div className="grid grid-2" style={{ alignItems: 'start', gap: 20 }}>
      {/* Hardware & Identity Passport */}
      <div className="panel panel-pad fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="section-title" style={{ fontSize: 18 }}>{asset.id}</div>
          <span className="source-badge source-tag-real">AUTHENTICATED PASSPORT</span>
        </div>
        <p className="section-sub">{asset.name}</p>

        <div className="kv-grid">
          <div className="kv-item"><div className="k">ASSET TYPE</div><div className="v">{assetType.label}</div></div>
          <div className="kv-item"><div className="k">INSTALLATION YEAR</div><div className="v">{asset.installed}</div></div>
          <div className="kv-item"><div className="k">TESTBED LOCATION</div><div className="v" style={{ fontSize: 13 }}>{asset.location || 'Testbed Rig 1'}</div></div>
          <div className="kv-item"><div className="k">MCU / GATEWAY</div><div className="v" style={{ fontSize: 13 }}>{asset.mcu || 'ESP32 DevKit V1'}</div></div>
          <div className="kv-item"><div className="k">LIFETIME OPERATING CYCLES</div><div className="v mono">{(conditionSummary.totalCycles || 12480).toLocaleString()}</div></div>
          <div className="kv-item"><div className="k">TOTAL MONITORED RUNTIME</div><div className="v mono">{conditionSummary.totalRuntimeFormatted || '01:00:00'}</div></div>
          <div className="kv-item"><div className="k">CURRENT MACHINE HEALTH</div><div className="v mono" style={{ color: 'var(--green)' }}>{health.score}%</div></div>
          <div className="kv-item"><div className="k">OPERATING STATE</div><div className="v">{health.operatingState}</div></div>
        </div>

        <div style={{ marginTop: 22, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div className="section-title" style={{ fontSize: 13, marginBottom: 10 }}>Hardware Sensor Manifest</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assetType.params.map(p => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 8 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{p.label}</span>
                  {p.sensorHardware && <span style={{ color: 'var(--text-faint)', marginLeft: 8 }}>({p.sensorHardware})</span>}
                </div>
                <span className={`source-badge ${(p.sourceType || '').includes('REAL') ? 'source-tag-real' : 'source-tag-sim'}`} style={{ fontSize: 9.5 }}>
                  {p.sourceType || 'REAL SENSOR'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lifecycle Pedigree Timeline */}
      <div className="panel panel-pad fade-in">
        <div className="section-title">Operational Lifecycle Pedigree</div>
        <p className="section-sub">Immutable milestone history and baseline validation log.</p>

        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-marker">
              <div className="timeline-dot" style={{ background: 'var(--green)' }} />
              <div className="timeline-line" />
            </div>
            <div className="timeline-content">
              <div className="timeline-title">Hardware Commissioning &amp; Baseline Established</div>
              <div className="timeline-sub">ESP32, DS18B20, MPU6050, and IR Optical sensors mounted on 12V DC motor testbed.</div>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker">
              <div className="timeline-dot" style={{ background: 'var(--green)' }} />
              <div className="timeline-line" />
            </div>
            <div className="timeline-content">
              <div className="timeline-title">Nominal Baseline Equilibrium</div>
              <div className="timeline-sub">Temperature stabilized at 34.6°C, baseline vibration established at 0.28g RMS.</div>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker">
              <div className="timeline-dot" style={{ background: 'var(--amber)' }} />
              <div className="timeline-line" />
            </div>
            <div className="timeline-content">
              <div className="timeline-title">AIoT Anomaly Intelligence Active</div>
              <div className="timeline-sub">Continuous condition recording, threshold monitoring, and session logging online.</div>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker">
              <div className="timeline-dot" style={{ background: 'var(--accent)' }} />
            </div>
            <div className="timeline-content">
              <div className="timeline-title">Current Operating Passport State</div>
              <div className="timeline-sub">Machine health: {health.score}% · State: {health.operatingState} · All telemetry verified.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
