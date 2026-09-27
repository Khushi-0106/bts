// ============================================================================
// SessionHistoryPage.jsx — Machine Operating Session History & Inspector
// ============================================================================

import React, { useState } from 'react'
import { useAssetData } from '../context/DataContext.jsx'

export default function SessionHistoryPage() {
  const { sessions, activeSession, startNewSession, endActiveSession, asset, assetType } = useAssetData()
  const [selectedSessionId, setSelectedSessionId] = useState(activeSession?.id || sessions[0]?.id)

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || activeSession || sessions[0]

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            Machine Session History
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
            {asset.id} · Session-based operational recording. Inspect exact operating envelope per run.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {activeSession && activeSession.status === 'ACTIVE' ? (
            <button className="btn" onClick={endActiveSession} style={{ background: 'var(--red-dim)', borderColor: 'var(--red)', color: 'var(--red)' }}>
              ⏹ Stop Active Session
            </button>
          ) : (
            <button className="btn" onClick={startNewSession} style={{ background: 'var(--green-dim)', borderColor: 'var(--green)', color: 'var(--green)' }}>
              ▶ Start New Session
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-3" style={{ alignItems: 'start', marginBottom: 24 }}>
        {/* Sessions List */}
        <div className="panel panel-pad" style={{ gridColumn: 'span 1' }}>
          <div className="section-title">Recorded Sessions</div>
          <p className="section-sub">Select an operating run to inspect its condition envelope.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.map(s => {
              const isSelected = s.id === selectedSession?.id
              const isActive = s.status === 'ACTIVE'
              const dateStr = new Date(s.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              const timeStr = new Date(s.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

              return (
                <div
                  key={s.id}
                  className={`panel session-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSessionId(s.id)}
                  style={{
                    padding: '14px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                    background: isSelected ? 'var(--surface-hover)' : 'var(--surface-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="mono" style={{ fontWeight: 800, fontSize: 13 }}>{s.id}</span>
                    <span className={`pill ${isActive ? 'pill-green' : 'pill-neutral'}`} style={{ fontSize: 10 }}>
                      {isActive ? 'ACTIVE' : 'COMPLETED'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{dateStr} at {timeStr}</span>
                    <span className="mono">{s.totalRuntimeFormatted || '00:00:00'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Session Inspector */}
        {selectedSession && (
          <div className="panel panel-pad" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }} className="mono">{selectedSession.id}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  Started: {new Date(selectedSession.startTime).toLocaleString()}
                  {selectedSession.endTime && ` · Ended: ${new Date(selectedSession.endTime).toLocaleString()}`}
                </div>
              </div>
              <span className={`pill ${selectedSession.status === 'ACTIVE' ? 'pill-green' : 'pill-neutral'}`}>
                {selectedSession.status}
              </span>
            </div>

            <div className="stats-summary-grid" style={{ marginBottom: 20 }}>
              <div className="stat-box">
                <div className="stat-label">SESSION RUNTIME</div>
                <div className="stat-main mono">{selectedSession.totalRuntimeFormatted || '01:00:00'}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">SESSION CYCLES</div>
                <div className="stat-main mono">{(selectedSession.totalCycles || 1840).toLocaleString()}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">FINAL HEALTH SCORE</div>
                <div className="stat-main mono" style={{ color: 'var(--green)' }}>{selectedSession.finalHealthScore || 92}%</div>
              </div>
            </div>

            <div className="section-title" style={{ fontSize: 13, marginBottom: 10 }}>Operating Condition Envelope</div>
            <div className="panel" style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PARAMETER</th>
                    <th>MIN OBSERVED</th>
                    <th>AVG OBSERVED</th>
                    <th>MAX OBSERVED</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Temperature</b></td>
                    <td className="mono">{selectedSession.minConditions?.temperature || 29.4} °C</td>
                    <td className="mono">{selectedSession.avgConditions?.temperature || 34.1} °C</td>
                    <td className="mono">{selectedSession.maxConditions?.temperature || 36.8} °C</td>
                  </tr>
                  <tr>
                    <td><b>Vibration (Peak)</b></td>
                    <td className="mono">{selectedSession.minConditions?.vibration || 0.18} g</td>
                    <td className="mono">{selectedSession.avgConditions?.vibration || 0.26} g</td>
                    <td className="mono">{selectedSession.maxConditions?.vibration || 0.42} g</td>
                  </tr>
                  <tr>
                    <td><b>Rotation Speed</b></td>
                    <td className="mono">{selectedSession.minConditions?.rpm || 278} RPM</td>
                    <td className="mono">{selectedSession.avgConditions?.rpm || 284} RPM</td>
                    <td className="mono">{selectedSession.maxConditions?.rpm || 290} RPM</td>
                  </tr>
                  <tr>
                    <td><b>Motor Current</b></td>
                    <td className="mono">{selectedSession.minConditions?.current || 3.4} A</td>
                    <td className="mono">{selectedSession.avgConditions?.current || 3.9} A</td>
                    <td className="mono">{selectedSession.maxConditions?.current || 4.4} A</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pattern-box" style={{ marginTop: 0 }}>
              <div className="pattern-title">SESSION MAINTENANCE INTELLIGENCE</div>
              <div className="pattern-text">
                {selectedSession.maintenanceRecommendation || 'Machine operated within nominal parameters with zero safety violations.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
