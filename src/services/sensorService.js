// ============================================================================
// sensorService.js — MechSight Sensor Ingestion & Stream Service
// ============================================================================
// Ingestion pipeline for ESP32 Physical Sensors:
// - DS18B20 Digital Temperature Sensor
// - MPU6050 6-DOF I2C Accelerometer / Gyroscope (Vibration)
// - Infrared Optical Sensor (RPM & Cycle Counting)
// - Optional ACS712 Current Sensor
// ============================================================================

import { nextReading, initialReading } from '../data/simulatedData.js'

export const REFRESH_INTERVAL_MS = 2500

// In-memory buffer for directly ingested readings from local network or tests
let lastIngestedReading = null
let lastIngestedTimestamp = 0

/**
 * Validates sensor values against physical hardware boundaries to prevent corrupt data
 */
export function validateSensorReading(raw) {
  const flags = []
  let isValid = true

  // Temperature sanity check (DS18B20 range: -55°C to +125°C, motor operating range: 0°C to 110°C)
  if (raw.temperature !== undefined) {
    if (isNaN(raw.temperature) || raw.temperature < -20 || raw.temperature > 125) {
      flags.push({ sensor: 'temperature', status: 'INVALID', reason: 'Out of realistic physical range' })
      isValid = false
    }
  }

  // Vibration sanity check (MPU6050: 0 to 16g)
  if (raw.vibration !== undefined) {
    if (isNaN(raw.vibration) || raw.vibration < 0 || raw.vibration > 25) {
      flags.push({ sensor: 'vibration', status: 'INVALID', reason: 'Erratic accelerometer reading' })
      isValid = false
    }
  }

  // RPM sanity check (0 to 10,000 RPM)
  if (raw.rpm !== undefined) {
    if (isNaN(raw.rpm) || raw.rpm < 0 || raw.rpm > 12000) {
      flags.push({ sensor: 'rpm', status: 'INVALID', reason: 'Optical pulse reading overflow' })
      isValid = false
    }
  }

  return { isValid, flags }
}

/**
 * Ingests a reading payload directly (e.g. from an ESP32 HTTP POST / Webhook)
 */
export function ingestReading(payload) {
  const validation = validateSensorReading(payload)
  if (!validation.isValid) {
    console.warn('Sensor data validation warnings:', validation.flags)
  }

  lastIngestedReading = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
    source: 'live',
  }
  lastIngestedTimestamp = Date.now()
  return lastIngestedReading
}

/**
 * Fetches the latest reading from an ESP32 hardware endpoint.
 * If endpoint fails, falls back safely to simulated data to preserve dashboard continuity.
 */
async function fetchLiveReading(endpointUrl, assetTypeKey, demoState, prevReading) {
  // If recent data was ingested directly in the last 6 seconds, use it
  if (lastIngestedReading && Date.now() - lastIngestedTimestamp < 6000) {
    return lastIngestedReading
  }

  if (endpointUrl && endpointUrl.startsWith('http')) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1800)

      const response = await fetch(endpointUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const json = await response.json()
        const validated = validateSensorReading(json)
        if (validated.isValid) {
          return {
            ...json,
            timestamp: json.timestamp || new Date().toISOString(),
            source: 'live',
          }
        }
      }
    } catch (e) {
      // Hardware temporarily unreachable — proceed to fallback below
    }
  }

  // Fallback to simulated reading
  return nextReading(assetTypeKey, demoState, prevReading)
}

/**
 * Starts a continuous reading stream for the active asset.
 */
export function startReadingStream({
  assetTypeKey,
  demoState,
  source = 'demo',
  endpointUrl = '',
  onReading,
}) {
  let prev = initialReading(assetTypeKey, demoState)
  onReading(prev)

  const interval = setInterval(async () => {
    try {
      let reading
      if (source === 'live') {
        reading = await fetchLiveReading(endpointUrl, assetTypeKey, demoState, prev)
      } else {
        reading = nextReading(assetTypeKey, demoState, prev)
      }
      prev = reading
      onReading(reading)
    } catch (err) {
      prev = nextReading(assetTypeKey, demoState, prev)
      onReading(prev)
    }
  }, REFRESH_INTERVAL_MS)

  return () => clearInterval(interval)
}
