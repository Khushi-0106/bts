// ============================================================================
// DemoMode.jsx — Prototype Simulation & Demonstration Controller
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

export default function DemoMode() {
  const { demoState, setDemoState, dataSource, setDataSource } = useAssetData()

  const handleSelect = (state) => {
    setDemoState(state)
  }

  return (
    <div className="panel panel-pad fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Prototype Demonstration Mode</div>
        <span className="demo-tag">SIMULATED SCENARIO INJECTOR</span>
      </div>
      <p className="section-sub">
        Inject simulated sensor conditions to demonstrate MechSight's AIoT intelligence pipeline.
        Critical mode only affects software calculations; no hazardous commands are sent to physical hardware.
      </p>

      <div className="demo-btn-row">
        <button
          className={'btn demo-btn' + (demoState === null || demoState === 'normal' ? ' btn-active ok' : '')}
          onClick={() => handleSelect('normal')}
        >
          <div style={{ fontWeight: 800 }}>NORMAL</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>Baseline conditions</div>
        </button>

        <button
          className={'btn demo-btn' + (demoState === 'warning' ? ' btn-active warn' : '')}
          onClick={() => handleSelect('warning')}
        >
          <div style={{ fontWeight: 800 }}>WARNING</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>Elevated vibration</div>
        </button>

        <button
          className={'btn demo-btn' + (demoState === 'abnormal' ? ' btn-active crit' : '')}
          onClick={() => handleSelect('abnormal')}
        >
          <div style={{ fontWeight: 800 }}>ABNORMAL</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>Multi-sensor threshold breach</div>
        </button>
      </div>

      <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Active Scenario: <b>{demoState ? demoState.toUpperCase() : 'LIVE REAL-TIME STREAM'}</b></span>
        {demoState && (
          <button
            className="btn"
            style={{ padding: '3px 8px', fontSize: 11 }}
            onClick={() => setDemoState(null)}
          >
            Reset to Baseline
          </button>
        )}
      </div>
    </div>
  )
}
