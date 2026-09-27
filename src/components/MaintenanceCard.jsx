import React, { useState } from 'react'
import { useAssetData } from '../context/DataContext.jsx'

const PRIORITY_COLOR = { HIGH: 'red', MEDIUM: 'amber', LOW: 'green' }

export default function MaintenanceCard() {
  const { maintenance, health } = useAssetData()
  const [expanded, setExpanded] = useState(false)
  if (!maintenance) return null
  const colorKey = PRIORITY_COLOR[maintenance.priority]

  return (
    <div className="panel maintenance-card fade-in">
      <div className="maintenance-head">
        <span className="maintenance-title">Maintenance Intelligence</span>
        <span className={'pill pill-' + colorKey}>{maintenance.priority} PRIORITY</span>
      </div>

      <div className="maintenance-row">
        <span className="k">CURRENT RECOMMENDATION</span>
        <span className="v" style={{ fontWeight: 800, fontSize: 16 }}>{maintenance.title}</span>
      </div>
      <div className="maintenance-row">
        <span className="k">REASON</span>
        <span className="v">{maintenance.reason}</span>
      </div>
      <div className="maintenance-row">
        <span className="k">SUGGESTED ACTION</span>
        <span className="v">{maintenance.action}</span>
      </div>

      <span className="expand-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? '– Hide explanation' : '+ Why this recommendation?'}
      </span>

      {expanded && (
        <div className="pattern-box" style={{ marginTop: 12 }}>
          <div className="pattern-text">
            This recommendation is generated from the asset's Health Score ({health?.score}%) and its
            weighted contributing factors. It reflects a statistical deviation from the asset's operating
            baseline, not a confirmed mechanical diagnosis. Always confirm with a physical inspection before
            taking the asset out of service.
          </div>
        </div>
      )}
    </div>
  )
}
