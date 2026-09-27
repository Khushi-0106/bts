// ============================================================================
// DataContext.jsx — Real Hardware Telemetry & Condition State Engine
// ============================================================================

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ASSET_TYPES, ASSETS } from '../data/assetData.js'
import {
  startReadingStream,
  fetchHardwareHistory,
  fetchHardwareSessions,
  fetchHardwareAnomalies,
  fetchDeviceDiagnostics,
} from '../services/sensorService.js'
import { generateHistory } from '../data/simulatedData.js'
import { computeHealth, primaryFactorNarrative, statusMeta } from '../utils/healthScore.js'
import { computeAnomaly, anomalyNarrative } from '../utils/anomalyDetection.js'
import { storageService, formatRuntime } from '../services/storageService.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [assetId, setAssetId] = useState('MOTOR-001')
  const [dataSource, setDataSource] = useState('live') // 'live' (Real Hardware) | 'demo' (Simulation Mode)
  const [demoState, setDemoState] = useState('normal') // 'normal' | 'warning' | 'abnormal'
  const [esp32Endpoint, setEsp32Endpoint] = useState('http://192.168.1.8:5000/api/sensors')

  // Real Hardware Telemetry State
  const [realReading, setRealReading] = useState(null)
  const [realHistory, setRealHistory] = useState([])
  const [realSessions, setRealSessions] = useState([])
  const [realAnomalies, setRealAnomalies] = useState([])
  const [hardwareStatus, setHardwareStatus] = useState({
    isOnline: false,
    secondsAgo: null,
    statusText: '🔴 HARDWARE OFFLINE',
  })
  const [diagnostics, setDiagnostics] = useState(null)

  // Demo Mode State (Completely separate sandbox)
  const [demoReading, setDemoReading] = useState(null)
  const [demoHistory, setDemoHistory] = useState([])

  const asset = ASSETS.find(a => a.id === assetId) || {
    id: assetId,
    type: 'industrial_motor',
    name: 'Industrial DC Motor Testbed',
    installed: '2026',
    location: 'AIoT Hardware Testbed — Rig 1',
    mcu: 'ESP32 DevKit V1 (Wi-Fi/HTTP)',
    sensors: 'DS18B20 (GPIO4) + Optical IR (GPIO18)',
  }
  const assetTypeKey = asset.type || 'industrial_motor'
  const assetType = ASSET_TYPES[assetTypeKey] || ASSET_TYPES.industrial_motor

  // 1. Fetch Real Hardware Records from Backend API
  const refreshRealData = async () => {
    if (dataSource === 'live') {
      const [hist, sess, anom, diag] = await Promise.all([
        fetchHardwareHistory(assetId),
        fetchHardwareSessions(assetId),
        fetchHardwareAnomalies(assetId),
        fetchDeviceDiagnostics(),
      ])
      setRealHistory(hist)
      setRealSessions(sess)
      setRealAnomalies(anom)
      setDiagnostics(diag)
    }
  }

  useEffect(() => {
    refreshRealData()
    const interval = setInterval(refreshRealData, 4000)
    return () => clearInterval(interval)
  }, [assetId, dataSource])

  // 2. Stream Ingestion Subscription
  useEffect(() => {
    const unsubscribe = startReadingStream({
      assetTypeKey,
      demoState,
      source: dataSource,
      onReading: (reading) => {
        if (dataSource === 'live') {
          setRealReading(reading)
          setRealHistory(prev => {
            const exists = prev.some(r => r.id === reading.id || (r.timestamp === reading.timestamp && r.deviceId === reading.deviceId))
            if (exists) return prev
            return [...prev, reading]
          })
        } else {
          setDemoReading(reading)
        }
      },
      onDeviceStatus: (status) => {
        if (dataSource === 'live') {
          setHardwareStatus(status)
        }
      },
    })
    return unsubscribe
  }, [assetId, assetTypeKey, dataSource, demoState])

  // Active Reading depends strictly on current mode
  const activeReading = useMemo(() => {
    if (dataSource === 'live') {
      return realReading
    }
    return demoReading
  }, [dataSource, realReading, demoReading])

  // Active History
  const activeRecords = useMemo(() => {
    if (dataSource === 'live') {
      return realHistory
    }
    return storageService.getRecords(assetId) || []
  }, [dataSource, realHistory, assetId])

  // Compute Health & Anomaly based on real sensors
  const health = useMemo(() => {
    if (dataSource === 'live') {
      if (!realReading) {
        return {
          score: 100,
          factors: [],
          status: 'OFFLINE',
          operatingState: 'OFFLINE',
          primaryFactor: null,
          abnormalParameters: [],
        }
      }
      return computeHealth(assetType, realReading)
    }
    if (!demoReading) return null
    return computeHealth(assetType, demoReading)
  }, [dataSource, realReading, demoReading, assetType])

  const anomaly = useMemo(() => {
    if (dataSource === 'live') {
      if (!realReading) return { score: 0, status: 'NORMAL', checks: [], anomalies: [] }
      return computeAnomaly(assetType, realReading)
    }
    if (!demoReading) return null
    return computeAnomaly(assetType, demoReading)
  }, [dataSource, realReading, demoReading, assetType])

  // Dynamic Condition Summary Stats
  const conditionSummary = useMemo(() => {
    const recs = activeRecords
    if (!recs || recs.length === 0) {
      return {
        minTemp: realReading?.temperature ?? '—',
        maxTemp: realReading?.temperature ?? '—',
        avgTemp: realReading?.temperature ?? '—',
        minRpm: realReading?.rpm ?? '—',
        maxRpm: realReading?.rpm ?? '—',
        avgRpm: realReading?.rpm ?? '—',
        minVib: realReading?.vibration ?? '—',
        maxVib: realReading?.vibration ?? '—',
        avgVib: realReading?.vibration ?? '—',
        totalCycles: realReading?.cycleCount || 0,
        totalRuntime: 0,
        totalRuntimeFormatted: '00:00:00',
        anomaliesCount: realAnomalies.length,
        warningsCount: 0,
        maintenanceCount: 0,
      }
    }

    const validTemps = recs.map(r => r.temperature).filter(v => v !== null && v !== undefined && !isNaN(v))
    const validRpms = recs.map(r => r.rpm).filter(v => v !== null && v !== undefined && !isNaN(v))
    const validVibs = recs.map(r => r.vibration).filter(v => v !== null && v !== undefined && !isNaN(v))
    const validCycles = recs.map(r => r.cycleCount).filter(v => v !== null && v !== undefined && !isNaN(v))

    const avg = arr => arr.length ? +(arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(1) : '—'

    return {
      minTemp: validTemps.length ? Math.min(...validTemps) : '—',
      maxTemp: validTemps.length ? Math.max(...validTemps) : '—',
      avgTemp: avg(validTemps),

      minRpm: validRpms.length ? Math.min(...validRpms) : '—',
      maxRpm: validRpms.length ? Math.max(...validRpms) : '—',
      avgRpm: validRpms.length ? Math.round(validRpms.reduce((s, x) => s + x, 0) / validRpms.length) : '—',

      minVib: validVibs.length ? Math.min(...validVibs) : '—',
      maxVib: validVibs.length ? Math.max(...validVibs) : '—',
      avgVib: validVibs.length ? +(validVibs.reduce((s, x) => s + x, 0) / validVibs.length).toFixed(2) : '—',

      totalCycles: validCycles.length ? Math.max(...validCycles) : (realReading?.cycleCount || 0),
      totalRuntime: recs.length,
      totalRuntimeFormatted: formatRuntime(recs.length),

      anomaliesCount: dataSource === 'live' ? realAnomalies.length : 0,
      warningsCount: recs.filter(r => r.operatingState === 'WARNING').length,
      maintenanceCount: recs.filter(r => r.operatingState === 'MAINTENANCE REQUIRED').length,
    }
  }, [activeRecords, realReading, realAnomalies, dataSource])

  // Get Historical Series for Charts
  const getHistory = (paramKey, range = '24H') => {
    if (dataSource === 'live') {
      if (!realHistory || realHistory.length === 0) return []

      let filtered = realHistory
      const now = Date.now()
      if (range === 'Live') filtered = realHistory.slice(-40)
      else if (range === '1H') filtered = realHistory.filter(r => new Date(r.timestamp).getTime() >= now - 3600 * 1000)
      else if (range === '6H') filtered = realHistory.filter(r => new Date(r.timestamp).getTime() >= now - 6 * 3600 * 1000)
      else if (range === '24H') filtered = realHistory.filter(r => new Date(r.timestamp).getTime() >= now - 24 * 3600 * 1000)
      else if (range === '7D') filtered = realHistory.filter(r => new Date(r.timestamp).getTime() >= now - 7 * 24 * 3600 * 1000)

      return filtered.map(r => {
        const val = r[paramKey] !== undefined ? r[paramKey] : null
        return {
          time: r.timestamp,
          label: new Date(r.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: val !== null ? val : 0,
        }
      })
    }

    // Demo Mode historical series
    return generateHistory(assetTypeKey, paramKey, range, demoReading?.[paramKey], demoState)
  }

  // Maintenance recommendations
  const maintenance = useMemo(() => {
    if (!health) return null
    if (health.operatingState === 'OFFLINE') {
      return {
        title: 'HARDWARE OFFLINE',
        priority: 'LOW',
        reason: 'ESP32 telemetry is currently disconnected or offline.',
        action: 'Power on ESP32 DevKit and verify Wi-Fi connection to MechSight server.',
      }
    }
    if (health.operatingState === 'MAINTENANCE REQUIRED') {
      return {
        title: 'IMMEDIATE INSPECTION REQUIRED',
        priority: 'HIGH',
        reason: `${health.abnormalParameters.join(', ') || 'Physical parameter'} exceeded critical safety limit.`,
        action: 'Safely halt motor. Inspect DS18B20 thermal contact, bearing friction, and optical IR disk.',
      }
    }
    if (health.operatingState === 'WARNING') {
      return {
        title: 'ROUTINE INSPECTION RECOMMENDED',
        priority: 'MEDIUM',
        reason: `${health.primaryFactor?.label || 'Temperature'} has risen above standard operating baseline.`,
        action: 'Verify ventilation, check motor current load, and verify shaft free rotation.',
      }
    }
    return {
      title: 'OPTIMAL OPERATION',
      priority: 'LOW',
      reason: 'Physical DS18B20 and IR sensor telemetry are operating within normal baseline.',
      action: 'Continuous AIoT condition recording active. No maintenance action required.',
    }
  }, [health])

  // Real Alerts
  const alerts = useMemo(() => {
    const list = []
    if (dataSource === 'live') {
      if (!hardwareStatus.isOnline) {
        list.push({ id: 'alt_off', level: 'MEDIUM', text: 'ESP32 Hardware Disconnected / Offline', minsAgo: hardwareStatus.secondsAgo ? Math.round(hardwareStatus.secondsAgo / 60) : 0 })
      } else {
        list.push({ id: 'alt_on', level: 'RESOLVED', text: 'ESP32 Hardware Streaming Live Telemetry', minsAgo: 0 })
      }
      realAnomalies.slice(0, 4).forEach(anom => {
        list.push({
          id: anom.id,
          level: anom.severity === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM',
          text: `${anom.parameter}: ${anom.observedValue} (${anom.deviation})`,
          minsAgo: Math.max(1, Math.round((Date.now() - new Date(anom.timestamp).getTime()) / 60000)),
        })
      })
    } else {
      list.push({ id: 'alt_demo', level: 'LOW', text: 'Demonstration simulation scenario active', minsAgo: 1 })
    }
    return list
  }, [dataSource, hardwareStatus, realAnomalies])

  // Actions: CSV Export
  const exportCSV = () => {
    if (dataSource === 'live') {
      window.open(`/api/sensors/export?assetId=${encodeURIComponent(assetId)}`, '_blank')
    } else {
      storageService.downloadCSV(assetId, activeRecords)
    }
  }

  // Actions: Clear Database
  const clearAllHistory = async () => {
    if (dataSource === 'live') {
      await fetch('/api/sensors/clear', { method: 'POST' })
      setRealHistory([])
      setRealSessions([])
      setRealAnomalies([])
      setRealReading(null)
    } else {
      storageService.clearHistory(assetId)
    }
  }

  const value = {
    assetId, setAssetId,
    asset,
    assetTypeKey, assetType,
    dataSource, setDataSource,
    demoState, setDemoState,
    esp32Endpoint, setEsp32Endpoint,
    reading: activeReading,
    realReading,
    records: activeRecords,
    sessions: dataSource === 'live' ? realSessions : storageService.getSessions(assetId),
    activeSession: dataSource === 'live' ? (realSessions.find(s => s.status === 'ACTIVE') || realSessions[0] || null) : null,
    anomalies: dataSource === 'live' ? realAnomalies : [],
    events: dataSource === 'live' ? realHistory.slice(-20).reverse() : [],
    alerts,
    hardwareStatus,
    diagnostics,
    conditionSummary,
    health,
    anomaly,
    anomalyText: anomaly ? anomalyNarrative(anomaly) : '',
    primaryFactorText: health ? primaryFactorNarrative(health.primaryFactor, assetType.label) : '',
    statusMeta: health ? statusMeta(health.operatingState) : statusMeta('NORMAL'),
    maintenance,
    getHistory,
    exportCSV,
    clearAllHistory,
    assets: ASSETS,
    assetTypes: ASSET_TYPES,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useAssetData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useAssetData must be used within DataProvider')
  return ctx
}
