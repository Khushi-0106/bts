import React from 'react'
import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◧' },
  { to: '/assets', label: 'Assets', icon: '▤' },
  { to: '/monitoring', label: 'Live Monitoring', icon: '◎' },
  { to: '/analytics', label: 'Analytics', icon: '▲' },
  { to: '/anomaly-detection', label: 'Anomaly Detection', icon: '✦' },
  { to: '/maintenance', label: 'Maintenance', icon: '✚' },
  { to: '/passport', label: 'Digital Asset Passport', icon: '▥' },
  { to: '/alerts', label: 'Alerts', icon: '◆' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">ASSETIQ</div>
        <div className="sidebar-tagline">AIoT Asset Intelligence</div>
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
          <span className="val"><span className="pulse-dot" /> SYSTEM ONLINE</span>
        </div>
        <div className="status-line">
          <span className="label">ESP32</span>
          <span className="val" style={{ color: 'var(--accent)' }}>CONNECTED</span>
        </div>
        <div className="status-line">
          <span className="label">DATA STREAM</span>
          <span className="val">ACTIVE</span>
        </div>
      </div>
    </aside>
  )
}
