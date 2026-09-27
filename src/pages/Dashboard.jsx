import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import HealthScore from '../components/HealthScore.jsx'
import SensorOverview from '../components/SensorOverview.jsx'
import SensorChart from '../components/SensorChart.jsx'
import AnomalyPanel from '../components/AnomalyPanel.jsx'
import AlertPanel from '../components/AlertPanel.jsx'
import MaintenanceCard from '../components/MaintenanceCard.jsx'
import DemoMode from '../components/DemoMode.jsx'
import AssetSelector from '../components/AssetSelector.jsx'
import BatteryPanel from '../components/BatteryPanel.jsx'

const CHART_COLORS = { temperature: '#f5a93f', vibration: '#7c8cff', current: '#b98cff', voltage: '#2fd983', soh: '#2fd983' }

export default function Dashboard() {
  const { asset, assetType, health, reading, assetTypeKey } = useAssetData()
  if (!reading || !health) return null

  const chartParams = assetType.params.filter(p => p.weight > 0 || p.isCounter)

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.01em' }}>Asset Health Overview</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
          Real-time condition monitoring, anomaly detection and maintenance intelligence.
        </p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <div className="panel panel-pad">
          <div className="kv-item"><div className="k">ASSET ID</div><div className="v mono">{asset.id}</div></div>
        </div>
        <div className="panel panel-pad">
          <div className="kv-item"><div className="k">ASSET TYPE</div><div className="v">{assetType.label}</div></div>
        </div>
        <div className="panel panel-pad">
          <div className="kv-item"><div className="k">OPERATING STATUS</div><div className="v" style={{ color: 'var(--green)' }}>RUNNING</div></div>
        </div>
        <div className="panel panel-pad">
          <div className="kv-item"><div className="k">HEALTH</div><div className="v mono">{health.score}%</div></div>
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <HealthScore />
      </div>

      <div style={{ marginBottom: 22 }}>
        <SensorOverview />
      </div>

      {assetTypeKey === 'ev_battery' && (
        <div style={{ marginBottom: 22 }}>
          <BatteryPanel />
        </div>
      )}

      <div style={{ marginBottom: 22 }}>
        <div className="section-title">Live Sensor Trends</div>
        <p className="section-sub">Each graph reflects a different monitored parameter for this asset.</p>
        <div className="grid grid-2">
          {chartParams.map(p => (
            <SensorChart key={p.key} paramKey={p.key} color={CHART_COLORS[p.key] || '#7c8cff'} />
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 22, alignItems: 'start' }}>
        <AnomalyPanel compact />
        <DemoMode />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 22, alignItems: 'start' }}>
        <MaintenanceCard />
        <AlertPanel limit={3} />
      </div>

      <AssetSelector />
    </div>
  )
}
