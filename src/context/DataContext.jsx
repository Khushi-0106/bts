// ============================================================================
// DataContext.jsx — Central Condition Intelligence State & Storage Hub
// ============================================================================

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ASSET_TYPES, ASSETS } from '../data/assetData.js'
import { startReadingStream } from '../services/sensorService.js'
import { generateHistory } from '../data/simulatedData.js'
import { computeHealth, primaryFactorNarrative, statusMeta } from '../utils/healthScore.js'
import { computeAnomaly, anomalyNarrative } from '../utils/anomalyDetection.js'
import { storageService, seedInitialHistory, formatRuntime } from '../services/storageService.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [assetId, setAssetId] = useState('AST-IND-001')
  const [demoState, setDemoState] = useState(null) // null = normal / real stream | 'normal' | 'warning' | 'abnormal'
  const [dataSource, setDataSource] = useState('live') // 'live' | 'demo'
  const [esp32Endpoint, setEsp32Endpoint] = useState('http://192.168.4.1/api/sensors')
  
  const [reading, setReading] = useState(null)
  const [records, setRecords] = useState([])
  const [sessions, setSessions] = useState([])
  const [events, setEvents] = useState([])
  const [anomalies, setAnomalies] = useState([])

  const prevOperatingStateRef = useRef('NORMAL')
  const readingRef = useRef(null)

  const asset = ASSETS.find(a => a.id === assetId) || ASSETS[0]
  const assetTypeKey = asset.type
  const assetType = ASSET_TYPES[assetTypeKey]

  // Initialize and load historical records for this asset
  useEffect(() => {
    // Seed initial history if storage is completely empty for this asset
    const seeded = seedInitialHistory(assetId, assetType, {
      cycles: assetType.params.find(p => p.isCounter),
      temperature: assetType.params.find(p => p.key === 'temperature'),
      vibration: assetType.params.find(p => p.key === 'vibration'),
      rpm: assetType.params.find(p => p.key === 'rpm'),
    })

    setRecords(storageService.getRecords(assetId) || seeded)
    setSessions(storageService.getSessions(assetId))
    setEvents(storageService.getEvents(assetId))
    setAnomalies(storageService.getAnomalies(assetId))
  }, [assetId, assetTypeKey])

  // Compute live health and anomaly states
  const health = useMemo(() => {
    if (!reading) return null
    return computeHealth(assetType, reading)
  }, [assetType, reading])

  const anomaly = useMemo(() => {
    if (!reading) return null
    return computeAnomaly(assetType, reading)
  }, [assetType, reading])

  // Maintenance recommendations derived from health
  const maintenance = useMemo(() => {
    if (!health) return null
    const state = health.operatingState

    if (state === 'MAINTENANCE REQUIRED' || demoState === 'abnormal') {
      return {
        title: 'IMMEDIATE INSPECTION REQUIRED',
        priority: 'HIGH',
        reason: `${health.abnormalParameters.join(', ') || 'Operating parameters'} have exceeded safety thresholds.`,
        action: 'Safely halt motor cycle. Inspect bearing lubrication, mounting stiffness, and electrical connections.',
      }
    }
    if (state === 'WARNING' || state === 'ABNORMAL' || demoState === 'warning') {
      return {
        title: 'ROUTINE INSPECTION RECOMMENDED',
        priority: 'MEDIUM',
        reason: `${health.primaryFactor?.label || 'Vibration'} is trending outside the normal operating baseline.`,
        action: `Inspect ${assetTypeKey === 'ev_battery' ? 'battery thermal management and cell connections' : 'motor mounting, coupling alignment, and shaft balance'}.`,
      }
    }
    return {
      title: 'OPTIMAL OPERATION',
      priority: 'LOW',
      reason: 'All monitored sensor parameters are within the established baseline.',
      action: 'Continue continuous AIoT condition recording. Next automated baseline check is continuous.',
    }
  }, [health, demoState, assetTypeKey])

  // Stream sensor data and record timestamped condition points
  useEffect(() => {
    const unsubscribe = startReadingStream({
      assetTypeKey,
      demoState,
      source: dataSource,
      endpointUrl: esp32Endpoint,
      onReading: (r) => {
        readingRef.current = r
        setReading(r)

        const h = computeHealth(assetType, r)
        const a = computeAnomaly(assetType, r)
        const state = h.operatingState

        const record = {
          id: `rec_${Date.now()}`,
          timestamp: r.timestamp || new Date().toISOString(),
          assetId,
          assetType: assetType.label,
          operatingState: state,
          temperature: r.temperature,
          vibration: r.vibration,
          rpm: r.rpm !== undefined ? r.rpm : 285,
          cycleCount: r.cycleCount !== undefined ? r.cycleCount : r.cycles,
          current: r.current,
          voltage: r.voltage,
          runtime: r.runtime,
          runtimeFormatted: r.runtimeFormatted || formatRuntime(r.runtime),
          sensorStatus: r.sensorStatus || {
            temperature: 'CONNECTED',
            vibration: 'CONNECTED',
            rpm: 'CONNECTED',
            cycles: 'CONNECTED',
            current: 'SIMULATED',
            voltage: 'SIMULATED',
          },
          sensorSources: r.sensorSources || {},
          healthScore: h.score,
          anomalyScore: a.score,
          anomalyStatus: a.status,
          abnormalParameters: h.abnormalParameters,
          maintenanceRecommendation: maintenance,
          source: dataSource,
        }

        // Persist record to storage
        const updatedRecords = storageService.addRecord(assetId, record)
        setRecords(updatedRecords)

        // Handle State Transition Events
        if (prevOperatingStateRef.current !== state) {
          const transEvent = {
            id: `ev_state_${Date.now()}`,
            timestamp: new Date().toISOString(),
            parameter: 'Operating State',
            observedCondition: `Transitioned from ${prevOperatingStateRef.current} → ${state}`,
            severity: state === 'NORMAL' ? 'INFO' : state === 'WARNING' ? 'WARNING' : 'CRITICAL',
            systemResponse: `Updated machine status and triggered condition recalculation.`,
          }
          prevOperatingStateRef.current = state
          const updatedEvents = storageService.addEvent(assetId, transEvent)
          setEvents(updatedEvents)
        }

        // Handle Anomaly Events
        if (a.anomalies && a.anomalies.length > 0) {
          a.anomalies.forEach(anom => {
            const fullAnomaly = {
              ...anom,
              timestamp: record.timestamp,
              assetId,
            }
            const updatedAnoms = storageService.addAnomaly(assetId, fullAnomaly)
            setAnomalies(updatedAnoms)
          })
        }
      },
    })

    return unsubscribe
  }, [assetId, assetTypeKey, demoState, dataSource, esp32Endpoint])

  // Calculate dynamic condition summary statistics from recorded history
  const conditionSummary = useMemo(() => {
    if (!records || records.length === 0) {
      return {
        minTemp: 28.5, maxTemp: 36.8, avgTemp: 34.2,
        minVib: 0.12, maxVib: 0.44, avgVib: 0.28,
        minRpm: 275, maxRpm: 295, avgRpm: 285,
        totalCycles: 12480, totalRuntime: 3600,
        anomaliesCount: 0, warningsCount: 0, maintenanceCount: 0,
      }
    }

    const temps = records.map(r => r.temperature).filter(v => v !== undefined && !isNaN(v))
    const vibs = records.map(r => r.vibration).filter(v => v !== undefined && !isNaN(v))
    const rpms = records.map(r => r.rpm).filter(v => v !== undefined && !isNaN(v))
    const cycles = records.map(r => r.cycleCount || r.cycles).filter(v => v !== undefined && !isNaN(v))

    const avg = arr => arr.length ? (arr.reduce((s, x) => s + x, 0) / arr.length) : 0

    return {
      minTemp: temps.length ? Math.min(...temps) : 34.0,
      maxTemp: temps.length ? Math.max(...temps) : 34.0,
      avgTemp: temps.length ? +avg(temps).toFixed(1) : 34.0,

      minVib: vibs.length ? Math.min(...vibs) : 0.25,
      maxVib: vibs.length ? Math.max(...vibs) : 0.25,
      avgVib: vibs.length ? +avg(vibs).toFixed(2) : 0.25,

      minRpm: rpms.length ? Math.min(...rpms) : 285,
      maxRpm: rpms.length ? Math.max(...rpms) : 285,
      avgRpm: rpms.length ? Math.round(avg(rpms)) : 285,

      totalCycles: cycles.length ? Math.max(...cycles) : 12480,
      totalRuntime: records[records.length - 1]?.runtime || 3600,
      totalRuntimeFormatted: records[records.length - 1]?.runtimeFormatted || '01:00:00',

      anomaliesCount: anomalies.length,
      warningsCount: records.filter(r => r.operatingState === 'WARNING' || r.operatingState === 'ABNORMAL').length,
      maintenanceCount: records.filter(r => r.operatingState === 'MAINTENANCE REQUIRED').length,
    }
  }, [records, anomalies])

  // Get historical series for charting
  const getHistory = (paramKey, range = '24H') => {
    // If we have live recorded points for this range, extract them
    if (range === 'Live' && records && records.length > 5) {
      return records.slice(-30).map(r => ({
        time: r.timestamp,
        label: new Date(r.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        value: r[paramKey] !== undefined ? r[paramKey] : r.cycleCount,
      }))
    }
    // Fall back to seamless historical generator
    return generateHistory(assetTypeKey, paramKey, range, reading?.[paramKey], demoState)
  }

  // Session Control
  const activeSession = useMemo(() => {
    return sessions.find(s => s.status === 'ACTIVE') || sessions[0] || null
  }, [sessions])

  const startNewSession = () => {
    const newSession = {
      id: `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-3)}`,
      assetId,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'ACTIVE',
      totalRuntime: 0,
      totalRuntimeFormatted: '00:00:00',
      totalCycles: 0,
      avgConditions: {
        temperature: reading?.temperature || 34.6,
        vibration: reading?.vibration || 0.28,
        rpm: reading?.rpm || 285,
        current: reading?.current || 3.8,
        voltage: reading?.voltage || 12.0,
      },
      maxConditions: {
        temperature: reading?.temperature || 34.6,
        vibration: reading?.vibration || 0.28,
        rpm: reading?.rpm || 285,
        current: reading?.current || 3.8,
        voltage: reading?.voltage || 12.0,
      },
      minConditions: {
        temperature: reading?.temperature || 34.6,
        vibration: reading?.vibration || 0.28,
        rpm: reading?.rpm || 285,
        current: reading?.current || 3.8,
        voltage: reading?.voltage || 12.0,
      },
      anomaliesCount: 0,
      finalHealthScore: health?.score || 95,
      maintenanceRecommendation: 'New machine operating session active.',
    }

    const updated = [newSession, ...sessions.map(s => s.status === 'ACTIVE' ? { ...s, status: 'COMPLETED', endTime: new Date().toISOString() } : s)]
    storageService.saveSessions(assetId, updated)
    setSessions(updated)

    // Add session start event
    const startEvent = {
      id: `ev_ses_${Date.now()}`,
      timestamp: new Date().toISOString(),
      parameter: 'Session Manager',
      observedCondition: `Started new recording session ${newSession.id}`,
      severity: 'INFO',
      systemResponse: 'Session timer and condition aggregator initialized.',
    }
    const updatedEvents = storageService.addEvent(assetId, startEvent)
    setEvents(updatedEvents)
  }

  const endActiveSession = () => {
    if (!activeSession || activeSession.status !== 'ACTIVE') return
    const updated = sessions.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          status: 'COMPLETED',
          endTime: new Date().toISOString(),
          finalHealthScore: health?.score || 90,
          maintenanceRecommendation: maintenance?.title || 'Session completed.',
        }
      }
      return s
    })
    storageService.saveSessions(assetId, updated)
    setSessions(updated)

    const endEvent = {
      id: `ev_ses_end_${Date.now()}`,
      timestamp: new Date().toISOString(),
      parameter: 'Session Manager',
      observedCondition: `Closed session ${activeSession.id}`,
      severity: 'INFO',
      systemResponse: 'Session summary and condition aggregates archived.',
    }
    const updatedEvents = storageService.addEvent(assetId, endEvent)
    setEvents(updatedEvents)
  }

  const exportCSV = () => {
    storageService.downloadCSV(assetId, records)
  }

  const clearAllHistory = () => {
    storageService.clearHistory(assetId)
    const seeded = seedInitialHistory(assetId, assetType, {
      cycles: assetType.params.find(p => p.isCounter),
      temperature: assetType.params.find(p => p.key === 'temperature'),
      vibration: assetType.params.find(p => p.key === 'vibration'),
      rpm: assetType.params.find(p => p.key === 'rpm'),
    })
    setRecords(seeded)
    setEvents(storageService.getEvents(assetId))
    setAnomalies(storageService.getAnomalies(assetId))
    setSessions(storageService.getSessions(assetId))
  }

  const alerts = useMemo(() => {
    const list = []
    if (health?.operatingState === 'MAINTENANCE REQUIRED' || demoState === 'abnormal') {
      list.push({ id: 'alt_crit', level: 'CRITICAL', text: `${health?.abnormalParameters?.join(', ') || 'Operating parameters'} exceeded critical threshold`, minsAgo: 1 })
    }
    if (health?.operatingState === 'WARNING' || health?.operatingState === 'ABNORMAL' || demoState === 'warning') {
      list.push({ id: 'alt_warn', level: 'MEDIUM', text: `${health?.primaryFactor?.label || 'Vibration'} elevated relative to baseline`, minsAgo: 3 })
    }
    if (events && events.length > 0) {
      events.slice(0, 4).forEach((ev, idx) => {
        if (ev.severity === 'WARNING' || ev.severity === 'CRITICAL') {
          list.push({
            id: `alt_ev_${ev.id || idx}`,
            level: ev.severity === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM',
            text: ev.observedCondition || ev.parameter,
            minsAgo: Math.max(1, Math.round((Date.now() - new Date(ev.timestamp).getTime()) / 60000)),
          })
        }
      })
    }
    list.push({ id: 'alt_res', level: 'RESOLVED', text: 'Telemetry synchronization verified', minsAgo: 12 })
    list.push({ id: 'alt_info', level: 'LOW', text: 'Baseline condition equilibrium active', minsAgo: 25 })
    return list
  }, [health, demoState, events])

  const value = {
    assetId, setAssetId,
    asset,
    assetTypeKey, assetType,
    demoState, setDemoState,
    dataSource, setDataSource,
    esp32Endpoint, setEsp32Endpoint,
    reading,
    records,
    sessions,
    activeSession,
    startNewSession,
    endActiveSession,
    events,
    anomalies,
    alerts,
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
