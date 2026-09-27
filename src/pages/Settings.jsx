// ============================================================================
// Settings.jsx — Hardware Telemetry, Thresholds & ESP32 Configuration
// ============================================================================

import React, { useState } from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import { REFRESH_INTERVAL_MS } from '../services/sensorService.js'

export default function Settings() {
  const {
    asset,
    assetType,
    demoState,
    setDemoState,
    dataSource,
    setDataSource,
    esp32Endpoint,
    setEsp32Endpoint,
    clearAllHistory,
  } = useAssetData()

  const [name, setName] = useState(asset.name)
  const [copied, setCopied] = useState(false)
  const [resetMessage, setResetMessage] = useState(false)

  const arduinoSnippet = `// ==========================================================
// MechSight ESP32 Firmware Snippet (HTTP Ingestion)
// Sensors: DS18B20 (GPIO4), MPU6050 (I2C SDA:21/SCL:22), IR (GPIO18)
// ==========================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <MPU6050.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_COMPUTER_IP:5173/api/sensors";

OneWire oneWire(4);
DallasTemperature tempSensor(&oneWire);
MPU6050 mpu;
volatile unsigned long pulseCount = 0;

void IRAM_ATTR countPulse() { pulseCount++; }

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  tempSensor.begin();
  Wire.begin();
  mpu.initialize();
  pinMode(18, INPUT_PULLUP);
  attachInterrupt(18, countPulse, FALLING);
}

void loop() {
  tempSensor.requestTemperatures();
  float temperature = tempSensor.getTempCByIndex(0);
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);
  float vibration = sqrt(ax*ax + ay*ay + az*az) / 16384.0;
  float rpm = (pulseCount * 60.0) / 2.0; // 2 slots disc
  pulseCount = 0;

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["assetId"] = "${asset.id}";
    doc["temperature"] = temperature;
    doc["vibration"] = vibration;
    doc["rpm"] = rpm;
    doc["cycleCount"] = 12480;

    String payload;
    serializeJson(doc, payload);
    int httpCode = http.POST(payload);
    http.end();
  }
  delay(2500);
}`

  const copyCode = () => {
    navigator.clipboard.writeText(arduinoSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    if (window.confirm('Reset all recorded condition history and restore baseline seed?')) {
      clearAllHistory()
      setResetMessage(true)
      setTimeout(() => setResetMessage(false), 3000)
    }
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>ESP32 &amp; System Configuration</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
          Configure physical sensor endpoints, engineering threshold baselines, and data ingestion.
        </p>
      </div>

      {/* Asset Metadata */}
      <div className="panel panel-pad settings-group">
        <div className="section-title">Machine Identity</div>
        <div className="settings-field">
          <label>Asset Name</label>
          <input className="text-input" value={name} onChange={e => setName(e.target.value)} style={{ width: 280 }} />
        </div>
        <div className="settings-field">
          <label>Asset Type</label>
          <span className="pill pill-accent">{assetType.label}</span>
        </div>
        <div className="settings-field">
          <label>Hardware Prototype Testbed</label>
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            ESP32 DevKit V1 + DS18B20 + MPU6050 + IR Optical Sensor + 12V DC Motor
          </span>
        </div>
      </div>

      {/* Data Source & ESP32 Ingestion */}
      <div className="panel panel-pad settings-group">
        <div className="section-title">Hardware Telemetry &amp; Ingestion Endpoint</div>
        <p className="section-sub">Configure how MechSight receives physical sensor packets over local Wi-Fi.</p>

        <div className="settings-field">
          <div>
            <label>Data Stream Mode</label>
            <div className="hint">Switch between live hardware telemetry and simulated demonstration mode.</div>
          </div>
          <div
            className="toggle"
            onClick={() => setDataSource(dataSource === 'live' ? 'demo' : 'live')}
          >
            {dataSource === 'live' ? 'LIVE HARDWARE' : 'DEMO MODE'}
            <span className={'toggle-track' + (dataSource === 'live' ? ' on' : '')}><span className="toggle-thumb" /></span>
          </div>
        </div>

        <div className="settings-field">
          <div>
            <label>ESP32 HTTP Ingestion Endpoint URL</label>
            <div className="hint">Target IP or local HTTP proxy where ESP32 streams JSON condition packets.</div>
          </div>
          <input
            className="text-input"
            value={esp32Endpoint}
            onChange={e => setEsp32Endpoint(e.target.value)}
            style={{ width: 320 }}
          />
        </div>

        <div className="settings-field">
          <div>
            <label>Demo Mode Scenario</label>
            <div className="hint">Injects simulated conditions when in Demo Mode.</div>
          </div>
          <select className="text-input" value={demoState || 'normal'} onChange={e => setDemoState(e.target.value)}>
            <option value="normal">Normal (Nominal Baseline)</option>
            <option value="warning">Warning (Elevated Vibration)</option>
            <option value="abnormal">Abnormal (Multi-Parameter Breach)</option>
          </select>
        </div>
      </div>

      {/* Threshold Matrix */}
      <div className="panel panel-pad settings-group">
        <div className="section-title">Engineering Thresholds &amp; Weights</div>
        <p className="section-sub">Warning and critical thresholds used by the anomaly detection and health scoring engines.</p>
        {assetType.params.filter(p => p.warnAt !== undefined).map(p => (
          <div className="settings-field" key={p.key}>
            <div>
              <label>{p.label}</label>
              <div className="hint">
                Baseline {p.baseline} {p.unit} · Warn {p.warnAt} {p.unit} · Crit {p.critAt} {p.unit} · Weight {Math.round(p.weight * 100)}%
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="text-input" defaultValue={p.warnAt} style={{ width: 75 }} title="Warning Threshold" />
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{p.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Database & Storage Management */}
      <div className="panel panel-pad settings-group">
        <div className="section-title">Condition Storage &amp; Database</div>
        <p className="section-sub">Manage local persistent condition records and session logs.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Reset Condition History</div>
            <div className="hint">Clears all stored observations and regenerates the clean baseline seed.</div>
          </div>
          <button className="btn" onClick={handleReset} style={{ color: 'var(--red)', borderColor: 'rgba(241,73,91,0.3)' }}>
            Reset Database Seed
          </button>
        </div>
        {resetMessage && (
          <div style={{ marginTop: 12, color: 'var(--green)', fontSize: 12.5 }}>
            ✓ Condition database reset successfully.
          </div>
        )}
      </div>

      {/* ESP32 Arduino Integration Guide & Code */}
      <div className="panel panel-pad">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>ESP32 Physical Prototype Firmware Snippet</div>
          <button className="btn" onClick={copyCode} style={{ fontSize: 12 }}>
            {copied ? '✓ Copied' : '📋 Copy Arduino C++ Code'}
          </button>
        </div>
        <p className="section-sub">
          Flash this sketch onto your ESP32 to publish real-time DS18B20 temperature, MPU6050 vibration, and optical IR RPM directly into MechSight.
        </p>

        <pre style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '16px',
          fontSize: 11.5,
          color: '#a0aec0',
          overflowX: 'auto',
          maxHeight: 280,
          fontFamily: 'var(--font-mono)',
        }}>
          {arduinoSnippet}
        </pre>
      </div>
    </div>
  )
}
