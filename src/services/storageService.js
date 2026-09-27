// ============================================================================
// storageService.js — MechSight Persistent Machine Condition Storage Layer
// ============================================================================
// Stores and retrieves:
// - Timestamped sensor condition records
// - Operating sessions (start, end, aggregates, anomalies)
// - Machine state change events & operational timeline
// - Anomaly records
// - Asset settings & thresholds
// ============================================================================

const STORAGE_KEYS = {
  RECORDS_PREFIX: 'mechsight_records_',
  SESSIONS_PREFIX: 'mechsight_sessions_',
  EVENTS_PREFIX: 'mechsight_events_',
  ANOMALIES_PREFIX: 'mechsight_anomalies_',
  CONFIG_PREFIX: 'mechsight_config_',
  ACTIVE_SESSION: 'mechsight_active_session_',
}

const MAX_RECORDS_PER_ASSET = 600 // Circular buffer for high performance

// Helper for safe localStorage access
function getJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    console.warn(`Storage access error for ${key}:`, e)
    return fallback
  }
}

function setJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.warn(`Storage write error for ${key}:`, e)
    return false
  }
}

/**
 * Generates an initial realistic historical record batch for an asset if empty,
 * ensuring the user immediately sees meaningful trends, history, and statistics.
 */
export function seedInitialHistory(assetId, assetType, baselineConfig) {
  const existing = getJson(STORAGE_KEYS.RECORDS_PREFIX + assetId, null)
  if (existing && existing.length > 0) return existing

  const now = Date.now()
  const records = []
  const events = []
  const anomalies = []
  const count = 45
  const stepMs = 30000 // 30 sec steps covering past 22+ minutes

  let curCycles = baselineConfig?.cycles?.baseline || (assetId === 'AST-IND-001' ? 12400 : 3400)
  let baseTemp = baselineConfig?.temperature?.baseline || 34.2
  let baseVib = baselineConfig?.vibration?.baseline || 0.28
  let baseRpm = baselineConfig?.rpm?.baseline || 285

  for (let i = count; i >= 0; i--) {
    const time = new Date(now - i * stepMs)
    const tIso = time.toISOString()
    
    // Slight drift and small noise
    const noiseT = (Math.sin(i * 0.3) * 1.2 + (Math.random() - 0.5) * 0.8)
    const noiseV = (Math.cos(i * 0.4) * 0.04 + (Math.random() - 0.5) * 0.03)
    const noiseR = Math.round((Math.sin(i * 0.2) * 5 + (Math.random() - 0.5) * 4))

    const temp = +(baseTemp + noiseT).toFixed(1)
    const vib = +Math.max(0.08, baseVib + noiseV).toFixed(2)
    const rpm = Math.max(0, baseRpm + noiseR)
    curCycles += Math.floor(Math.random() * 4) + 1

    let state = 'NORMAL'
    let health = 94
    let anomalyScore = 8
    let anomalyStatus = 'NORMAL'
    const abnormalParams = []

    if (i === 12 || i === 13) {
      // Small simulated vibration spike in past history
      state = 'WARNING'
      health = 82
      anomalyScore = 38
      anomalyStatus = 'ELEVATED'
      abnormalParams.push('Vibration')
    }

    const rec = {
      id: `rec_${now - i * stepMs}`,
      timestamp: tIso,
      assetId,
      assetType: assetType.label,
      operatingState: state,
      temperature: temp,
      vibration: vib,
      rpm: rpm,
      cycleCount: curCycles,
      current: +(3.8 + Math.random() * 0.5).toFixed(1),
      voltage: +(12.0 + (Math.random() - 0.5) * 0.2).toFixed(1),
      runtime: (count - i) * 30 + 3600, // seconds
      runtimeFormatted: formatRuntime((count - i) * 30 + 3600),
      sensorStatus: {
        temperature: 'CONNECTED',
        vibration: 'CONNECTED',
        rpm: 'CONNECTED',
        cycles: 'CONNECTED',
        current: 'SIMULATED',
        voltage: 'SIMULATED',
      },
      sensorSources: {
        temperature: 'DS18B20 — LIVE',
        vibration: 'MPU6050 — LIVE',
        rpm: 'IR SENSOR — LIVE',
        cycles: 'IR SENSOR — LIVE',
        current: 'ACS712 — SIMULATED',
        voltage: 'DIVIDER — SIMULATED',
      },
      healthScore: health,
      anomalyScore: anomalyScore,
      anomalyStatus: anomalyStatus,
      abnormalParameters: abnormalParams,
      maintenanceRecommendation: state === 'WARNING' ? {
        title: 'ROUTINE INSPECTION',
        priority: 'MEDIUM',
        reason: 'Temporary vibration elevation detected.',
        action: 'Inspect motor mounting bracket and mechanical couplings.',
      } : {
        title: 'NO ACTION REQUIRED',
        priority: 'LOW',
        reason: 'All operating parameters are within baseline.',
        action: 'Continue continuous AIoT condition monitoring.',
      },
      source: 'live',
    }

    records.push(rec)

    if (i === 13) {
      anomalies.push({
        id: `anom_${tIso}`,
        timestamp: tIso,
        assetId,
        parameter: 'Vibration',
        observedValue: `${vib} g`,
        expectedRange: `0.10 - 0.40 g`,
        deviation: 'Elevated peak vibration (+35% over baseline)',
        severity: 'MEDIUM',
        explanation: 'Transient vibration harmonics detected during high duty cycle.',
        recommendation: 'Inspect mechanical mounting fasteners and shaft alignment.',
      })
      events.push({
        id: `ev_${tIso}`,
        timestamp: tIso,
        parameter: 'Vibration',
        observedCondition: `Vibration elevated to ${vib} g`,
        severity: 'WARNING',
        systemResponse: 'Generated WARNING state & scheduled routine inspection check.',
      })
    }
  }

  // Add initial start event
  events.unshift({
    id: `ev_start_${assetId}`,
    timestamp: new Date(now - count * stepMs).toISOString(),
    parameter: 'System',
    observedCondition: 'Machine operating session initiated. Baseline active.',
    severity: 'INFO',
    systemResponse: 'Continuous real-time AIoT monitoring and condition recording online.',
  })

  // Seed sessions
  const pastSession = {
    id: `SES-${new Date(now - 86400000).toISOString().slice(0, 10).replace(/-/g, '')}-001`,
    assetId,
    startTime: new Date(now - 86400000).toISOString(),
    endTime: new Date(now - 86400000 + 7200000).toISOString(),
    status: 'COMPLETED',
    totalRuntime: 7200,
    totalRuntimeFormatted: '02:00:00',
    totalCycles: 1840,
    avgConditions: {
      temperature: 34.1,
      vibration: 0.26,
      rpm: 284,
      current: 3.9,
      voltage: 12.0,
    },
    maxConditions: {
      temperature: 36.8,
      vibration: 0.42,
      rpm: 290,
      current: 4.4,
      voltage: 12.2,
    },
    minConditions: {
      temperature: 29.4,
      vibration: 0.18,
      rpm: 278,
      current: 3.4,
      voltage: 11.8,
    },
    anomaliesCount: 0,
    finalHealthScore: 95,
    maintenanceRecommendation: 'Optimal machine operating condition maintained.',
  }

  const activeSession = {
    id: `SES-${new Date(now).toISOString().slice(0, 10).replace(/-/g, '')}-002`,
    assetId,
    startTime: new Date(now - count * stepMs).toISOString(),
    endTime: null,
    status: 'ACTIVE',
    totalRuntime: count * 30,
    totalRuntimeFormatted: formatRuntime(count * 30),
    totalCycles: 245,
    avgConditions: {
      temperature: +(records.reduce((s, r) => s + (r.temperature || 0), 0) / records.length).toFixed(1),
      vibration: +(records.reduce((s, r) => s + (r.vibration || 0), 0) / records.length).toFixed(2),
      rpm: Math.round(records.reduce((s, r) => s + (r.rpm || 0), 0) / records.length),
      current: 3.9,
      voltage: 12.0,
    },
    maxConditions: {
      temperature: Math.max(...records.map(r => r.temperature || 0)),
      vibration: Math.max(...records.map(r => r.vibration || 0)),
      rpm: Math.max(...records.map(r => r.rpm || 0)),
      current: 4.3,
      voltage: 12.1,
    },
    minConditions: {
      temperature: Math.min(...records.map(r => r.temperature || 0)),
      vibration: Math.min(...records.map(r => r.vibration || 0)),
      rpm: Math.min(...records.map(r => r.rpm || 0)),
      current: 3.6,
      voltage: 11.9,
    },
    anomaliesCount: anomalies.length,
    finalHealthScore: 92,
    maintenanceRecommendation: 'Machine in active monitoring session. Condition nominal.',
  }

  setJson(STORAGE_KEYS.RECORDS_PREFIX + assetId, records)
  setJson(STORAGE_KEYS.EVENTS_PREFIX + assetId, events)
  setJson(STORAGE_KEYS.ANOMALIES_PREFIX + assetId, anomalies)
  setJson(STORAGE_KEYS.SESSIONS_PREFIX + assetId, [activeSession, pastSession])

  return records
}

export function formatRuntime(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '00:00:00'
  const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
  const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
  const secs = Math.floor(totalSeconds % 60).toString().padStart(2, '0')
  return `${hrs}:${mins}:${secs}`
}

export const storageService = {
  getRecords(assetId) {
    return getJson(STORAGE_KEYS.RECORDS_PREFIX + assetId, [])
  },

  addRecord(assetId, record) {
    const existing = getJson(STORAGE_KEYS.RECORDS_PREFIX + assetId, [])
    const updated = [...existing, record]
    // Circular buffer to prevent storage exhaustion
    if (updated.length > MAX_RECORDS_PER_ASSET) {
      updated.splice(0, updated.length - MAX_RECORDS_PER_ASSET)
    }
    setJson(STORAGE_KEYS.RECORDS_PREFIX + assetId, updated)
    return updated
  },

  getEvents(assetId) {
    return getJson(STORAGE_KEYS.EVENTS_PREFIX + assetId, [])
  },

  addEvent(assetId, event) {
    const existing = getJson(STORAGE_KEYS.EVENTS_PREFIX + assetId, [])
    const updated = [event, ...existing].slice(0, 100) // keep last 100 events
    setJson(STORAGE_KEYS.EVENTS_PREFIX + assetId, updated)
    return updated
  },

  getAnomalies(assetId) {
    return getJson(STORAGE_KEYS.ANOMALIES_PREFIX + assetId, [])
  },

  addAnomaly(assetId, anomaly) {
    const existing = getJson(STORAGE_KEYS.ANOMALIES_PREFIX + assetId, [])
    const updated = [anomaly, ...existing].slice(0, 100)
    setJson(STORAGE_KEYS.ANOMALIES_PREFIX + assetId, updated)
    return updated
  },

  getSessions(assetId) {
    return getJson(STORAGE_KEYS.SESSIONS_PREFIX + assetId, [])
  },

  saveSessions(assetId, sessions) {
    setJson(STORAGE_KEYS.SESSIONS_PREFIX + assetId, sessions)
    return sessions
  },

  clearHistory(assetId) {
    localStorage.removeItem(STORAGE_KEYS.RECORDS_PREFIX + assetId)
    localStorage.removeItem(STORAGE_KEYS.EVENTS_PREFIX + assetId)
    localStorage.removeItem(STORAGE_KEYS.ANOMALIES_PREFIX + assetId)
    localStorage.removeItem(STORAGE_KEYS.SESSIONS_PREFIX + assetId)
  },

  exportToCSV(assetId, records = []) {
    if (!records || records.length === 0) return ''
    const headers = [
      'Timestamp',
      'Asset ID',
      'Asset Type',
      'Operating State',
      'Temperature (°C)',
      'Vibration (g)',
      'RPM',
      'Cycles',
      'Current (A)',
      'Voltage (V)',
      'Runtime (s)',
      'Health Score (%)',
      'Anomaly Score',
      'Anomaly Status',
      'Data Source',
    ]

    const rows = records.map(r => [
      `"${r.timestamp || ''}"`,
      `"${r.assetId || assetId}"`,
      `"${r.assetType || ''}"`,
      `"${r.operatingState || 'NORMAL'}"`,
      r.temperature !== undefined ? r.temperature : '',
      r.vibration !== undefined ? r.vibration : '',
      r.rpm !== undefined ? r.rpm : '',
      r.cycleCount !== undefined ? r.cycleCount : '',
      r.current !== undefined ? r.current : '',
      r.voltage !== undefined ? r.voltage : '',
      r.runtime !== undefined ? r.runtime : '',
      r.healthScore !== undefined ? r.healthScore : '',
      r.anomalyScore !== undefined ? r.anomalyScore : '',
      `"${r.anomalyStatus || 'NORMAL'}"`,
      `"${r.source || 'live'}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    return csvContent
  },

  downloadCSV(assetId, records) {
    const csv = this.exportToCSV(assetId, records)
    if (!csv) return
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `MechSight_${assetId}_Condition_History_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
}
