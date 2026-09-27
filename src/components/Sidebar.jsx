// ============================================================================
// Sidebar.jsx — MechSight Main Navigation & Sensor Telemetry Status
// ============================================================================

import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAssetData } from '../context/DataContext.jsx'

const NAV = [
  { to: '/', label: 'Overview Dashboard', icon: '◧' },
  { to: '/history', label: 'Condition History', icon: '▤' },
  { to: '/conditions', label: 'Operating Conditions', icon: '◎' },
  { to: '/graphs', label: 'Condition Graphs', icon: '▲' },
  { to: '/timeline', label: 'Timeline & Events', icon: '◷' },
  { to: '/sessions', label: 'Session History', icon: '⏱' },
  { to: '/anomaly-detection', label: 'Anomaly Detection', icon: '✦' },
  { to: '/maintenance', label: 'Maintenance Intelligence', icon: '✚' },
  { to: '/passport', label: 'Digital Machine Passport', icon: '▥' },
  { to: '/alerts', label: 'Alert Center', icon: '◆' },
  { to: '/assets', label: 'Fleet Assets', icon: '⚙' },
  { to: '/settings', label: 'ESP32 & Settings', icon: '🛠' },
]

export default function Sidebar() {
  const { dataSource } = useAssetData()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">MECHSIGHT</div>
        <div className="sidebar-tagline">AIoT Machine Intelligence</div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-status">
        <div className="status-line">
          <span className="label">SYSTEM</span>
          <span className="val"><span className="pulse-dot" /> ONLINE</span>
        </div>
        <div className="status-line">
          <span className="label">DS18B20 (TEMP)</span>
          <span className="val" style={{ color: 'var(--green)' }}>CONNECTED</span>
        </div>
        <div className="status-line">
          <span className="label">MPU6050 (VIB)</span>
          <span className="val" style={{ color: 'var(--green)' }}>CONNECTED</span>
        </div>
        <div className="status-line">
          <span className="label">IR OPTICAL (RPM)</span>
          <span className="val" style={{ color: 'var(--green)' }}>CONNECTED</span>
        </div>
        <div className="status-line">
          <span className="label">DATA MODE</span>
          <span className="val" style={{ color: dataSource === 'live' ? 'var(--green)' : 'var(--accent-2)' }}>
            {dataSource === 'live' ? 'LIVE ESP32' : 'DEMO'}
          </span>
        </div>
      </div>
    </aside>
  )
}
