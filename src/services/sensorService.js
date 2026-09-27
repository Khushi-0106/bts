// ============================================================================
// sensorService.js
//
// This is the ONLY file the rest of the app talks to for live sensor data.
// Right now it returns SIMULATED_DATA. To connect the real ESP32 prototype:
//
//   1. Stand up an API endpoint (e.g. a small Node/Express or FastAPI server)
//      that the ESP32 posts readings to over Wi-Fi, in this shape:
//
//        {
//          "assetId": "AST-IND-001",
//          "assetType": "industrial_motor",
//          "temperature": 48.6,
//          "vibration": 2.31,
//          "cycles": 1842,
//          "current": 4.2,
//          "timestamp": "2026-09-24T10:42:18"
//        }
//
//   2. Replace the body of `fetchLiveReading()` below with a `fetch(...)`
//      call to that endpoint.
//   3. Leave `startReadingStream()`'s interface exactly as-is — every
//      component subscribes through it, so no UI code needs to change.
//   4. Keep `nextReading()` (simulated) as the automatic fallback: if the
//      live fetch fails or the ESP32 is offline, the dashboard should keep
//      working on demo data rather than showing a blank screen.
// ============================================================================

import { nextReading, initialReading } from '../data/simulatedData.js'

const REFRESH_MS = 2500

// Swap this out for a real `fetch('/api/readings/latest')` call.
async function fetchLiveReading(assetTypeKey, demoState, prevReading) {
  // Simulated network latency, so the "LIVE" toggle feels real in a demo.
  return nextReading(assetTypeKey, demoState, prevReading)
}

/**
 * Starts a polling stream of readings for the given asset.
 * @param {object} opts
 * @param {string} opts.assetTypeKey
 * @param {'normal'|'warning'|'critical'|null} opts.demoState
 * @param {'demo'|'live'} opts.source
 * @param {(reading: object) => void} opts.onReading
 * @returns {() => void} unsubscribe function
 */
export function startReadingStream({ assetTypeKey, demoState, source, onReading }) {
  let prev = initialReading(assetTypeKey, demoState)
  onReading(prev)

  const interval = setInterval(async () => {
    try {
      const reading =
        source === 'live'
          ? await fetchLiveReading(assetTypeKey, demoState, prev) // falls back to sim internally today
          : nextReading(assetTypeKey, demoState, prev)
      prev = reading
      onReading(reading)
    } catch (err) {
      // Live source unavailable — keep the dashboard alive on simulated data.
      prev = nextReading(assetTypeKey, demoState, prev)
      onReading(prev)
    }
  }, REFRESH_MS)

  return () => clearInterval(interval)
}

export const REFRESH_INTERVAL_MS = REFRESH_MS
