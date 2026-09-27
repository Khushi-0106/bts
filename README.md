# MechSight — AIoT-Based Machine Condition Intelligence

> **Physical Machine Condition Monitoring, Anomaly Detection & Operating Envelope Recording**

MechSight is an AIoT-based machine condition intelligence platform that monitors physical machines using multi-channel sensor telemetry and records the complete operating conditions experienced by each machine over its operating lifetime.

```
Sensors (DS18B20 + MPU6050 + IR) → ESP32 Ingestion → Machine Baseline → Anomaly Engine → Health Score → Operating History & Sessions
```

---

## Physical Hardware Prototype

The active physical testbed (`AST-IND-001`) integrates:
- **Microcontroller**: ESP32 DevKit V1 (Wi-Fi 802.11 b/g/n)
- **Temperature Sensor**: DS18B20 Digital 1-Wire Thermometer (`GPIO4`)
- **Vibration Sensor**: MPU6050 6-DOF I2C Accelerometer / Gyroscope (`SDA: GPIO21`, `SCL: GPIO22`)
- **Rotation / Speed Sensor**: Infrared Optical Slotted Sensor TCRT5000 / LM393 (`GPIO18` Interrupt)
- **Motor Under Test**: 12V DC Geared Motor with L298N / Driver
- **Current Sensor (Optional)**: ACS712-05A Hall-Effect Shunt

---

## Core Capabilities

1. **Complete Timestamped Condition Recording**:
   - Every recorded observation contains: `Timestamp`, `Asset ID`, `Asset Type`, `Operating State`, `Temperature`, `Vibration`, `RPM`, `Cycle Count`, `Current`, `Voltage`, `Runtime`, `Sensor Status`, `Health Score`, `Anomaly Score`, and `Maintenance Recommendation`.
2. **Dedicated Operating Conditions Matrix**:
   - Displays all measurable conditions with engineering thresholds, baseline ranges, observed statistics (Min / Avg / Max), and explicit sensor provenance (`REAL SENSOR`, `CALCULATED`, `SIMULATED`).
3. **Session-Based Operational Recording**:
   - Records discrete machine sessions with start/stop times, duration, total cycles, condition envelopes, and final health outcomes.
4. **Machine Condition Timeline & Events**:
   - Audit trail of operational state transitions (`NORMAL` → `WARNING` → `ABNORMAL` → `MAINTENANCE REQUIRED`), threshold breaches, and automated system responses.
5. **Independent Time-Series Graphs**:
   - Multi-channel graphs for Temperature, Vibration, RPM, Cycles, Current, and Voltage across `Live`, `1H`, `6H`, `24H`, and `7D` horizons.
6. **AIoT Anomaly Detection & Health Scoring**:
   - Explainable baseline-deviation scoring with contributing factor breakdown.
7. **CSV Data Export**:
   - Instant export of complete timestamped operating condition logs for offline analysis.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## Connecting the Physical ESP32 Hardware

The ESP32 publishes readings over local Wi-Fi to MechSight.

### Payload Schema (`POST /api/sensors`):

```json
{
  "assetId": "AST-IND-001",
  "temperature": 34.6,
  "vibration": 0.28,
  "rpm": 286,
  "cycleCount": 12482,
  "current": 3.8,
  "voltage": 12.0,
  "timestamp": "2026-09-27T22:30:00.000Z"
}
```

The ESP32 firmware sketch is available directly in the **Settings** view with pinout configurations and Wi-Fi credentials.
