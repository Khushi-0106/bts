import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import './styles.css'

import Dashboard from './pages/Dashboard.jsx'
import Assets from './pages/Assets.jsx'
import Monitoring from './pages/Monitoring.jsx'
import Analytics from './pages/Analytics.jsx'
import AnomalyDetection from './pages/AnomalyDetection.jsx'
import Maintenance from './pages/Maintenance.jsx'
import AssetPassportPage from './pages/AssetPassportPage.jsx'
import Alerts from './pages/Alerts.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <DataProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/anomaly-detection" element={<AnomalyDetection />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/passport" element={<AssetPassportPage />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </DataProvider>
  )
}
