// ============================================================================
// sensorService.js — Hardware Telemetry Pipeline & SSE Stream Service
// ============================================================================
// Talks directly to the MechSight backend API (/api/sensors/latest, /api/sensors/stream)
// and handles real hardware packet ingestion & offline detection.
// ============================================================================

import { nextReading, initialReading } from '../data/simulatedData.js'

export const REFRESH_INTERVAL_MS = 1000

// In-Memory cache for latest received real hardware packet
let latestHardwareReading = null
let lastHardwareTimestamp = 0

/**
 * Connects to Server-Sent Events stream (/api/sensors/stream) for zero-latency live updates
 */
export function initHardwareSSE(onReadingUpdate, onStatusChange) {
  let eventSource = null

  try {
    eventSource = new EventSource('/api/sensors/stream')

    eventSource.addEventListener('reading', (event) => {
      try {
        const data = JSON.parse(event.data)
        latestHardwareReading = data
        lastHardwareTimestamp = Date.now()
        if (onReadingUpdate) onReadingUpdate(data)
        if (onStatusChange) onStatusChange({ isOnline: true, lastReceivedAgo: 0 })
      } catch (e) {
        console.error('[SSE] Failed to parse reading event:', e)
      }
    })

    eventSource.addEventListener('connected', () => {
      console.log('[SSE] Stream connected to MechSight backend.')
    })

    eventSource.onerror = () => {
      // Backend temporarily offline
      if (onStatusChange) onStatusChange({ isOnline: false })
    }
  } catch (err) {
    console.warn('[SSE] EventSource unavailable:', err)
  }

  return () => {
    if (eventSource) {
      eventSource.close()
    }
  }
}

/**
 * Fetches the latest real hardware reading directly from the backend
 */
export async function fetchLatestHardwareReading(assetId = 'MOTOR-001') {
  try {
    const res = await fetch(`/api/sensors/latest?assetId=${encodeURIComponent(assetId)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.latest) {
        latestHardwareReading = data.latest
        lastHardwareTimestamp = Date.now() - (data.secondsAgo * 1000 || 0)
      }
      return data
    }
  } catch (e) {
    // Backend offline or unreachable
  }
  return {
    latest: latestHardwareReading,
    isOnline: false,
    secondsAgo: latestHardwareReading ? Math.round((Date.now() - lastHardwareTimestamp) / 1000) : null,
    statusText: '🔴 HARDWARE OFFLINE',
    totalRecords: 0,
  }
}

/**
 * Fetches real historical records from the backend database
 */
export async function fetchHardwareHistory(assetId = 'MOTOR-001', range = 'all') {
  try {
    const res = await fetch(`/api/sensors/history?assetId=${encodeURIComponent(assetId)}&range=${encodeURIComponent(range)}`)
    if (res.ok) {
      const data = await res.json()
      return data.records || []
    }
  } catch (e) {
    console.warn('[API] Could not fetch real history:', e)
  }
  return []
}

/**
 * Fetches real sessions from backend database
 */
export async function fetchHardwareSessions(assetId = 'MOTOR-001') {
  try {
    const res = await fetch(`/api/sensors/sessions?assetId=${encodeURIComponent(assetId)}`)
    if (res.ok) {
      const data = await res.json()
      return data.sessions || []
    }
  } catch (e) {
    console.warn('[API] Could not fetch real sessions:', e)
  }
  return []
}

/**
 * Fetches real anomalies from backend database
 */
export async function fetchHardwareAnomalies(assetId = 'MOTOR-001') {
  try {
    const res = await fetch(`/api/anomalies?assetId=${encodeURIComponent(assetId)}`)
    if (res.ok) {
      const data = await res.json()
      return data.anomalies || []
    }
  } catch (e) {
    console.warn('[API] Could not fetch real anomalies:', e)
  }
  return []
}

/**
 * Fetches device diagnostics
 */
export async function fetchDeviceDiagnostics() {
  try {
    const res = await fetch('/api/device/status')
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {
    // offline
  }
  return null
}

/**
 * Starts continuous telemetry polling / stream
 */
export function startReadingStream({
  assetTypeKey,
  demoState,
  source = 'live',
  onReading,
  onDeviceStatus,
}) {
  let prev = initialReading(assetTypeKey, demoState)

  if (source === 'demo') {
    onReading(prev)
    const interval = setInterval(() => {
      prev = nextReading(assetTypeKey, demoState, prev)
      onReading(prev)
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }

  // REAL HARDWARE MODE
  // 1. Initial fetch from API
  fetchLatestHardwareReading().then(res => {
    if (res.latest) {
      onReading(res.latest)
    }
    if (onDeviceStatus) {
      onDeviceStatus({
        isOnline: res.isOnline,
        secondsAgo: res.secondsAgo,
        statusText: res.statusText,
      })
    }
  })

  // 2. Continuous fallback polling and status check every 1s
  const interval = setInterval(async () => {
    const res = await fetchLatestHardwareReading()
    if (res.latest) {
      onReading(res.latest)
    }
    if (onDeviceStatus) {
      onDeviceStatus({
        isOnline: res.isOnline,
        secondsAgo: res.secondsAgo,
        statusText: res.statusText,
      })
    }
  }, REFRESH_INTERVAL_MS)

  // 3. SSE Stream setup
  const closeSSE = initHardwareSSE(
    (reading) => onReading(reading),
    (status) => {
      if (onDeviceStatus) {
        onDeviceStatus({
          isOnline: status.isOnline,
          secondsAgo: status.lastReceivedAgo || 0,
          statusText: status.isOnline ? '🟢 REAL HARDWARE CONNECTED' : '🔴 HARDWARE OFFLINE',
        })
      }
    }
  )

  return () => {
    clearInterval(interval)
    closeSSE()
  }
}
