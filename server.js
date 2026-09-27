// ============================================================================
// server.js — MechSight Real-Time Hardware Telemetry & Persistent API Server
// ============================================================================
// Ingestion endpoint for physical ESP32 + DS18B20 + IR Sensor + MPU6050
// Listens on 0.0.0.0:5000 so ESP32 on the local Wi-Fi can stream readings.
// ============================================================================

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 5000
const HOST = '0.0.0.0'
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'real_sensor_db.json')

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '1mb' }))

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// In-Memory Database Structure with Persistent Disk Mirroring
let db = {
  records: [],     // All timestamped real sensor readings
  sessions: [],    // Discrete operating sessions
  anomalies: [],   // Real anomaly events triggered by threshold crossing
  events: [],      // State changes, sensor connections, machine start/stop
  stats: {
    totalPacketsReceived: 0,
    totalPacketsAccepted: 0,
    totalPacketsRejected: 0,
    lastPacketTimestamp: null,
    activeDeviceId: null,
  }
}

// Load existing database from disk
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8')
    db = JSON.parse(raw)
    console.log(`[Database] Loaded ${db.records.length} real sensor records from disk.`)
  } catch (err) {
    console.error('[Database] Error loading database file. Initializing clean db:', err)
  }
}

// Save database to disk (debounced)
let saveTimeout = null
function saveDb() {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    try {
      // Keep up to 20,000 real records to prevent uncontrolled disk growth
      if (db.records.length > 20000) {
        db.records = db.records.slice(-20000)
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
    } catch (e) {
      console.error('[Database] Failed to write database to disk:', e)
    }
  }, 500)
}

// SSE (Server-Sent Events) clients for real-time push to frontend
let sseClients = []

function broadcastSSE(type, data) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
  sseClients.forEach(client => {
    try {
      client.res.write(payload)
    } catch (e) {
      // client disconnected
    }
  })
}

// Helper: Get local network IP addresses
function getLocalIps() {
  const interfaces = os.networkInterfaces()
  const ips = []
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ interface: name, address: iface.address })
      }
    }
  }
  return ips
}

// Helper: Validation of real sensor readings
function validateReading(body) {
  const errors = []

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Body must be a valid JSON object'] }
  }

  // Temperature check (DS18B20 range: -55°C to 125°C)
  if (body.temperature !== undefined && body.temperature !== null) {
    const t = Number(body.temperature)
    if (isNaN(t) || !isFinite(t) || t < -40 || t > 125) {
      errors.push(`Invalid temperature value: ${body.temperature}. Must be between -40 and 125 °C.`)
    }
  }

  // RPM check (IR sensor pulse rate: 0 to 12000 RPM)
  if (body.rpm !== undefined && body.rpm !== null) {
    const r = Number(body.rpm)
    if (isNaN(r) || !isFinite(r) || r < 0 || r > 15000) {
      errors.push(`Invalid rpm value: ${body.rpm}. Must be non-negative and finite.`)
    }
  }

  // Cycle count check
  if (body.cycleCount !== undefined && body.cycleCount !== null) {
    const c = Number(body.cycleCount)
    if (isNaN(c) || !isFinite(c) || c < 0) {
      errors.push(`Invalid cycleCount: ${body.cycleCount}. Must be a positive integer.`)
    }
  }

  // Vibration check
  if (body.vibration !== undefined && body.vibration !== null) {
    const v = Number(body.vibration)
    if (isNaN(v) || !isFinite(v) || v < 0 || v > 50) {
      errors.push(`Invalid vibration: ${body.vibration}. Must be between 0 and 50 g.`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Health calculation based ONLY on currently available real sensors
function computeRealHealth(temp, rpm, vib) {
  let score = 100
  const factors = []

  // 1. Temperature factor (Baseline ~34°C, Warning >48°C, Critical >65°C)
  if (temp !== null && temp !== undefined) {
    let tHealth = 100
    if (temp > 65) {
      tHealth = Math.max(10, 30 - ((temp - 65) / 20) * 30)
    } else if (temp > 48) {
      tHealth = 70 - ((temp - 48) / 17) * 40
    } else if (temp > 38) {
      tHealth = 100 - ((temp - 38) / 10) * 30
    }
    factors.push({ name: 'Temperature', health: Math.round(tHealth), weight: 0.45, available: true })
  } else {
    factors.push({ name: 'Temperature', health: null, weight: 0, available: false })
  }

  // 2. RPM factor (Baseline ~285 RPM, Warning <200 or >350, Critical <100 or >450)
  if (rpm !== null && rpm !== undefined) {
    let rHealth = 100
    if (rpm === 0) {
      rHealth = 90 // Motor stopped/idle
    } else if (rpm < 120 || rpm > 420) {
      rHealth = 30
    } else if (rpm < 200 || rpm > 340) {
      rHealth = 65
    }
    factors.push({ name: 'Rotation (RPM)', health: Math.round(rHealth), weight: 0.35, available: true })
  } else {
    factors.push({ name: 'Rotation (RPM)', health: null, weight: 0, available: false })
  }

  // 3. Vibration factor (Only if MPU6050 is connected!)
  if (vib !== null && vib !== undefined) {
    let vHealth = 100
    if (vib > 0.85) {
      vHealth = Math.max(15, 30 - ((vib - 0.85) / 0.5) * 30)
    } else if (vib > 0.50) {
      vHealth = 70 - ((vib - 0.50) / 0.35) * 40
    } else if (vib > 0.35) {
      vHealth = 100 - ((vib - 0.35) / 0.15) * 30
    }
    factors.push({ name: 'Vibration', health: Math.round(vHealth), weight: 0.20, available: true })
  } else {
    factors.push({ name: 'Vibration', health: null, weight: 0, available: false })
  }

  const activeFactors = factors.filter(f => f.available && f.weight > 0)
  if (activeFactors.length > 0) {
    const totalWeight = activeFactors.reduce((s, f) => s + f.weight, 0)
    const weightedSum = activeFactors.reduce((s, f) => s + f.health * (f.weight / totalWeight), 0)
    score = Math.round(Math.max(0, Math.min(100, weightedSum)))
  }

  let operatingState = 'NORMAL'
  if (score < 50 || (temp && temp > 65) || (vib && vib > 0.85)) {
    operatingState = 'MAINTENANCE REQUIRED'
  } else if (score < 75 || (temp && temp > 48) || (vib && vib > 0.50)) {
    operatingState = 'WARNING'
  } else if (rpm === 0 && temp !== null) {
    operatingState = 'IDLE'
  } else {
    operatingState = 'RUNNING'
  }

  return { score, operatingState, factors }
}

// Session state manager
let activeSession = null
let lastSessionPacketTime = 0

function updateSession(assetId, deviceId, record) {
  const now = Date.now()
  const timeoutMs = 45000 // 45s of inactivity closes a session

  if (!activeSession || (now - lastSessionPacketTime > timeoutMs)) {
    if (activeSession && !activeSession.endTime) {
      activeSession.endTime = new Date(lastSessionPacketTime).toISOString()
      activeSession.status = 'COMPLETED'
    }

    // Start a new session
    const sessionId = `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`
    activeSession = {
      id: sessionId,
      assetId,
      deviceId,
      startTime: record.timestamp || new Date().toISOString(),
      endTime: null,
      status: 'ACTIVE',
      totalRuntime: 0,
      totalCyclesStart: record.cycleCount || 0,
      totalCycles: 0,
      minConditions: {
        temperature: record.temperature,
        rpm: record.rpm,
        vibration: record.vibration,
      },
      maxConditions: {
        temperature: record.temperature,
        rpm: record.rpm,
        vibration: record.vibration,
      },
      avgConditions: {
        temperature: record.temperature,
        rpm: record.rpm,
        vibration: record.vibration,
      },
      tempSamples: record.temperature !== null ? [record.temperature] : [],
      rpmSamples: record.rpm !== null ? [record.rpm] : [],
      anomaliesCount: 0,
      finalHealthScore: record.healthScore,
      finalMachineState: record.operatingState,
    }
    db.sessions.unshift(activeSession)
  } else {
    // Update active session
    activeSession.totalRuntime = Math.round((now - new Date(activeSession.startTime).getTime()) / 1000)
    if (record.cycleCount !== null && activeSession.totalCyclesStart !== null) {
      activeSession.totalCycles = Math.max(0, record.cycleCount - activeSession.totalCyclesStart)
    }

    if (record.temperature !== null) {
      activeSession.tempSamples.push(record.temperature)
      if (activeSession.minConditions.temperature === null || record.temperature < activeSession.minConditions.temperature) {
        activeSession.minConditions.temperature = record.temperature
      }
      if (activeSession.maxConditions.temperature === null || record.temperature > activeSession.maxConditions.temperature) {
        activeSession.maxConditions.temperature = record.temperature
      }
      activeSession.avgConditions.temperature = +(activeSession.tempSamples.reduce((a, b) => a + b, 0) / activeSession.tempSamples.length).toFixed(1)
    }

    if (record.rpm !== null) {
      activeSession.rpmSamples.push(record.rpm)
      if (activeSession.minConditions.rpm === null || record.rpm < activeSession.minConditions.rpm) {
        activeSession.minConditions.rpm = record.rpm
      }
      if (activeSession.maxConditions.rpm === null || record.rpm > activeSession.maxConditions.rpm) {
        activeSession.maxConditions.rpm = record.rpm
      }
      activeSession.avgConditions.rpm = Math.round(activeSession.rpmSamples.reduce((a, b) => a + b, 0) / activeSession.rpmSamples.length)
    }

    activeSession.finalHealthScore = record.healthScore
    activeSession.finalMachineState = record.operatingState
  }

  lastSessionPacketTime = now
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// 1. POST /api/sensors — Ingest Real Sensor Data from ESP32
app.post('/api/sensors', (req, res) => {
  db.stats.totalPacketsReceived++

  const validation = validateReading(req.body)
  if (!validation.valid) {
    db.stats.totalPacketsRejected++
    return res.status(400).json({
      status: 'error',
      message: 'Invalid sensor data payload',
      errors: validation.errors,
    })
  }

  const {
    assetId = 'MOTOR-001',
    deviceId = 'ESP32-001',
    timestamp = new Date().toISOString(),
    temperature = null,
    rotationDetected = false,
    rpm = null,
    cycleCount = null,
    vibration = null,
    current = null,
    voltage = null,
    dataSource = 'REAL_SENSOR',
  } = req.body

  // Duplicate Packet Protection (deviceId + timestamp)
  const isDuplicate = db.records.slice(-10).some(r => r.deviceId === deviceId && r.timestamp === timestamp)
  if (isDuplicate) {
    return res.status(200).json({ status: 'duplicate_ignored', message: 'Reading already recorded' })
  }

  // Calculate Health & State from Real Readings
  const { score: healthScore, operatingState, factors } = computeRealHealth(temperature, rpm, vibration)

  // Compute Anomaly Score & Events
  let anomalyScore = 0
  let anomalyStatus = 'NORMAL'
  if (temperature && temperature > 48) {
    anomalyScore += 40
    anomalyStatus = 'ELEVATED'
    // Log Real Anomaly
    db.anomalies.unshift({
      id: `anom_t_${Date.now()}`,
      timestamp,
      assetId,
      deviceId,
      parameter: 'Temperature',
      observedValue: `${temperature} °C`,
      expectedRange: '20.0 – 48.0 °C',
      deviation: `+${(temperature - 34.6).toFixed(1)} °C`,
      severity: temperature > 65 ? 'CRITICAL' : 'WARNING',
      explanation: 'Elevated motor temperature observed on DS18B20 digital sensor.',
      recommendation: 'Verify motor loading and ambient cooling ventilation.',
      dataSource: 'REAL_SENSOR',
    })
  }

  if (vibration && vibration > 0.50) {
    anomalyScore += 50
    anomalyStatus = 'ELEVATED'
    db.anomalies.unshift({
      id: `anom_v_${Date.now()}`,
      timestamp,
      assetId,
      deviceId,
      parameter: 'Vibration',
      observedValue: `${vibration} g`,
      expectedRange: '0.10 – 0.50 g',
      deviation: `+${(vibration - 0.28).toFixed(2)} g`,
      severity: vibration > 0.85 ? 'CRITICAL' : 'WARNING',
      explanation: 'Vibration amplitude spike detected on MPU6050 accelerometer.',
      recommendation: 'Inspect mounting fasteners and shaft alignment.',
      dataSource: 'REAL_SENSOR',
    })
  }

  // Sensor status manifest
  const sensorStatus = {
    ds18b20: temperature !== null ? 'CONNECTED' : 'DISCONNECTED',
    irSensor: (rpm !== null || cycleCount !== null || rotationDetected) ? 'CONNECTED' : 'DISCONNECTED',
    mpu6050: vibration !== null ? 'CONNECTED' : 'NOT_CONNECTED',
    currentSensor: current !== null ? 'CONNECTED' : 'UNAVAILABLE',
    voltageSensor: voltage !== null ? 'CONNECTED' : 'UNAVAILABLE',
  }

  const record = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    assetId,
    deviceId,
    timestamp,
    temperature: temperature !== null ? +Number(temperature).toFixed(1) : null,
    rotationDetected: Boolean(rotationDetected),
    rpm: rpm !== null ? Math.round(Number(rpm)) : null,
    cycleCount: cycleCount !== null ? Math.round(Number(cycleCount)) : null,
    vibration: vibration !== null ? +Number(vibration).toFixed(2) : null,
    current: current !== null ? +Number(current).toFixed(2) : null,
    voltage: voltage !== null ? +Number(voltage).toFixed(2) : null,
    healthScore,
    anomalyScore,
    anomalyStatus,
    operatingState,
    dataSource: 'REAL_SENSOR',
    sensorStatus,
  }

  db.records.push(record)
  db.stats.totalPacketsAccepted++
  db.stats.lastPacketTimestamp = timestamp
  db.stats.activeDeviceId = deviceId

  // Update session
  updateSession(assetId, deviceId, record)

  // Trigger disk save
  saveDb()

  // Push SSE update to live frontend
  broadcastSSE('reading', record)

  console.log(`[ESP32 Telemetry] Temp: ${record.temperature ?? 'N/A'}°C | RPM: ${record.rpm ?? 'N/A'} | Cycles: ${record.cycleCount ?? 'N/A'} | Vib: ${record.vibration ?? 'N/A'} | Health: ${healthScore}%`)

  res.status(201).json({
    status: 'success',
    recordId: record.id,
    healthScore,
    anomalyScore,
    operatingState,
    timestamp,
  })
})

// 2. GET /api/sensors/latest — Latest Real Hardware Reading
app.get('/api/sensors/latest', (req, res) => {
  const assetId = req.query.assetId || 'MOTOR-001'
  const assetRecords = db.records.filter(r => !req.query.assetId || r.assetId === assetId)
  const latest = assetRecords.length > 0 ? assetRecords[assetRecords.length - 1] : null

  const now = Date.now()
  let isOnline = false
  let secondsAgo = null
  let statusText = '🔴 HARDWARE OFFLINE'

  if (latest && latest.timestamp) {
    secondsAgo = Math.max(0, Math.round((now - new Date(latest.timestamp).getTime()) / 1000))
    if (secondsAgo <= 6) {
      isOnline = true
      statusText = '🟢 REAL HARDWARE CONNECTED'
    } else if (secondsAgo <= 30) {
      isOnline = true
      statusText = '🟡 DATA DELAYED'
    } else {
      isOnline = false
      statusText = '🔴 HARDWARE OFFLINE'
    }
  }

  res.json({
    latest,
    isOnline,
    secondsAgo,
    statusText,
    totalRecords: assetRecords.length,
    activeSession: activeSession || null,
  })
})

// 3. GET /api/sensors/history — Historical Real Data (with range filter)
app.get('/api/sensors/history', (req, res) => {
  const assetId = req.query.assetId || 'MOTOR-001'
  const range = (req.query.range || 'all').toLowerCase()
  let records = db.records.filter(r => !req.query.assetId || r.assetId === assetId)

  const now = Date.now()
  if (range === 'live') {
    records = records.slice(-50)
  } else if (range === '1h') {
    const cutoff = now - 3600 * 1000
    records = records.filter(r => new Date(r.timestamp).getTime() >= cutoff)
  } else if (range === '6h') {
    const cutoff = now - 6 * 3600 * 1000
    records = records.filter(r => new Date(r.timestamp).getTime() >= cutoff)
  } else if (range === '24h') {
    const cutoff = now - 24 * 3600 * 1000
    records = records.filter(r => new Date(r.timestamp).getTime() >= cutoff)
  } else if (range === '7d') {
    const cutoff = now - 7 * 24 * 3600 * 1000
    records = records.filter(r => new Date(r.timestamp).getTime() >= cutoff)
  }

  res.json({
    count: records.length,
    range,
    records,
  })
})

// 4. GET /api/sensors/sessions — Operating Sessions
app.get('/api/sensors/sessions', (req, res) => {
  const assetId = req.query.assetId
  const sessions = assetId ? db.sessions.filter(s => s.assetId === assetId) : db.sessions
  res.json({ sessions })
})

// 5. GET /api/anomalies — Real Anomalies
app.get('/api/anomalies', (req, res) => {
  const assetId = req.query.assetId
  const anomalies = assetId ? db.anomalies.filter(a => a.assetId === assetId) : db.anomalies
  res.json({ anomalies })
})

// 6. GET /api/device/status — Hardware Connection Diagnostics
app.get('/api/device/status', (req, res) => {
  const latest = db.records.length > 0 ? db.records[db.records.length - 1] : null
  const now = Date.now()
  let secondsAgo = null
  let isOnline = false

  if (latest && latest.timestamp) {
    secondsAgo = Math.max(0, Math.round((now - new Date(latest.timestamp).getTime()) / 1000))
    isOnline = secondsAgo <= 10
  }

  res.json({
    deviceId: db.stats.activeDeviceId || 'ESP32-001',
    isOnline,
    lastPacketSecondsAgo: secondsAgo,
    stats: db.stats,
    localIps: getLocalIps(),
    serverTime: new Date().toISOString(),
    sensors: latest?.sensorStatus || {
      ds18b20: 'NO_DATA',
      irSensor: 'NO_DATA',
      mpu6050: 'NOT_CONNECTED',
    },
  })
})

// 7. GET /api/diagnostics — Developer Diagnostics View
app.get('/api/diagnostics', (req, res) => {
  res.json({
    server: {
      uptimeSeconds: Math.round(process.uptime()),
      host: HOST,
      port: PORT,
      localIps: getLocalIps(),
    },
    database: {
      totalRealRecords: db.records.length,
      totalSessions: db.sessions.length,
      totalAnomalies: db.anomalies.length,
      dbFileSizeKb: fs.existsSync(DB_FILE) ? +(fs.statSync(DB_FILE).size / 1024).toFixed(1) : 0,
    },
    hardwareStats: db.stats,
    latestRecord: db.records[db.records.length - 1] || null,
  })
})

// 8. GET /api/sensors/stream — Real-Time Server-Sent Events (SSE)
app.get('/api/sensors/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const clientId = Date.now()
  sseClients.push({ id: clientId, res })

  // Send initial ping and latest reading
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`)
  if (db.records.length > 0) {
    res.write(`event: reading\ndata: ${JSON.stringify(db.records[db.records.length - 1])}\n\n`)
  }

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId)
  })
})

// 9. GET /api/sensors/export — Export Real Sensor Data to CSV
app.get('/api/sensors/export', (req, res) => {
  const assetId = req.query.assetId
  const records = assetId ? db.records.filter(r => r.assetId === assetId) : db.records

  const headers = [
    'Timestamp',
    'Asset ID',
    'Device ID',
    'Temperature (°C)',
    'RPM',
    'Cycle Count',
    'Vibration (g)',
    'Health Score (%)',
    'Anomaly Score',
    'Anomaly Status',
    'Machine State',
    'Data Source',
  ]

  const rows = records.map(r => [
    `"${r.timestamp}"`,
    `"${r.assetId}"`,
    `"${r.deviceId}"`,
    r.temperature !== null ? r.temperature : '',
    r.rpm !== null ? r.rpm : '',
    r.cycleCount !== null ? r.cycleCount : '',
    r.vibration !== null ? r.vibration : '',
    r.healthScore !== null ? r.healthScore : '',
    r.anomalyScore !== null ? r.anomalyScore : '',
    `"${r.anomalyStatus || 'NORMAL'}"`,
    `"${r.operatingState || 'RUNNING'}"`,
    `"${r.dataSource || 'REAL_SENSOR'}"`,
  ])

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="MechSight_Real_Sensors_${new Date().toISOString().slice(0, 10)}.csv"`)
  res.send(csv)
})

// 10. POST /api/sensors/clear — Clear Real Database
app.post('/api/sensors/clear', (req, res) => {
  db.records = []
  db.sessions = []
  db.anomalies = []
  db.events = []
  db.stats.totalPacketsReceived = 0
  db.stats.totalPacketsAccepted = 0
  db.stats.totalPacketsRejected = 0
  db.stats.lastPacketTimestamp = null
  saveDb()
  broadcastSSE('cleared', { time: new Date().toISOString() })
  res.json({ status: 'success', message: 'Real sensor database cleared.' })
})

// Serve built frontend assets from dist/
const DIST_DIR = path.join(__dirname, 'dist')
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'))
    }
    next()
  })
}

// Start listening on 0.0.0.0 so ESP32 on LAN can reach the backend
app.listen(PORT, HOST, () => {
  const ips = getLocalIps()
  console.log('\n===============================================================')
  console.log(`  🚀 MechSight Real Hardware API Server Online!`)
  console.log(`  📡 Listening on: http://0.0.0.0:${PORT}`)
  console.log(`  🌐 Local Machine Access: http://localhost:${PORT}`)
  console.log(`  📶 ESP32 Wi-Fi Ingestion Target URL:`)
  ips.forEach(ip => {
    console.log(`     👉 http://${ip.address}:${PORT}/api/sensors  (${ip.interface})`)
  })
  console.log('===============================================================\n')
})
