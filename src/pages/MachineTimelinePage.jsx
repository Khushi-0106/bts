// ============================================================================
// MachineTimelinePage.jsx — Chronological Machine Condition Events Stream
// ============================================================================

import React, { useState } from 'react'
import { useAssetData } from '../context/DataContext.jsx'

const SEV_COLOR = {
  INFO: 'pill-neutral',
  WARNING: 'pill-amber',
  CRITICAL: 'pill-red',
}

export default function MachineTimelinePage() {
  const { events, asset } = useAssetData()
  const [filter, setFilter] = useState('ALL')

  const filteredEvents = events.filter(e => {
    if (filter === 'ALL') return true
    return e.severity === filter
  })

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          Machine Condition Timeline
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
          {asset.id} · Audit trail of state transitions, threshold breaches, anomaly triggers, and automated system responses.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="panel panel-pad" style={{ marginBottom: 20, padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)' }}>SEVERITY FILTER:</span>
          {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map(s => (
            <button
              key={s}
              className={'filter-chip' + (filter === s ? ' active' : '')}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="panel panel-pad">
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-faint)' }}>
            No operational events logged in this category.
          </div>
        ) : (
          <div className="timeline">
            {filteredEvents.map((ev, i) => {
              const d = new Date(ev.timestamp)
              const timeStr = d.toLocaleTimeString()
              const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              const pillClass = SEV_COLOR[ev.severity] || 'pill-neutral'

              return (
                <div className="timeline-item" key={ev.id || i}>
                  <div className="timeline-marker">
                    <div
                      className="timeline-dot"
                      style={{
                        background: ev.severity === 'CRITICAL' ? 'var(--red)' : ev.severity === 'WARNING' ? 'var(--amber)' : 'var(--accent)',
                      }}
                    />
                    {i < filteredEvents.length - 1 && <div className="timeline-line" />}
                  </div>

                  <div className="timeline-content" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="timeline-title" style={{ fontSize: 14 }}>{ev.parameter}</span>
                        <span className={'pill ' + pillClass} style={{ fontSize: 10 }}>{ev.severity}</span>
                      </div>
                      <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                        {timeStr} · {dateStr}
                      </span>
                    </div>

                    <div style={{ fontSize: 13.5, color: 'var(--text)', marginBottom: 6 }}>
                      {ev.observedCondition}
                    </div>

                    {ev.systemResponse && (
                      <div className="pattern-box" style={{ marginTop: 6, padding: '8px 12px', background: 'var(--surface)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.04em' }}>
                          SYSTEM RESPONSE
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>
                          {ev.systemResponse}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
