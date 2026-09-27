// Central configuration for every asset type ASSETIQ understands.
// Adding a new asset type (e.g. "compressor") only requires an entry here —
// every page, chart and health calculation reads from this file.

export const DEMO_STATES = ['normal', 'warning', 'critical']

// Each param: key, label, unit, baseline (typical healthy value),
// warnAt / critAt thresholds, weight (contribution to health score),
// direction: 'lower_better' (default, e.g. temperature) or 'higher_better' (e.g. SoH),
// isCounter: true for monotonically-increasing values like cycles (not scored directly).
export const ASSET_TYPES = {
  industrial_motor: {
    label: 'Industrial Motor',
    short: 'Motor',
    unitIcon: '⚙',
    params: [
      { key: 'temperature', label: 'Temperature', unit: '°C', baseline: 48, warnAt: 62, critAt: 82, weight: 0.30 },
      { key: 'vibration', label: 'Vibration', unit: 'g', baseline: 2.3, warnAt: 4.2, critAt: 6.5, weight: 0.40 },
      { key: 'current', label: 'Current', unit: 'A', baseline: 4.2, warnAt: 8.0, critAt: 12.0, weight: 0.10 },
      { key: 'cycles', label: 'Operating Cycles', unit: '', baseline: 1842, weight: 0.20, isCounter: true, ratePerTick: 3 },
    ],
    demo: {
      normal: { temperature: 48, vibration: 2.3, current: 4.2 },
      warning: { temperature: 61, vibration: 4.8, current: 6.9 },
      critical: { temperature: 79, vibration: 6.9, current: 11.4 },
    },
  },
  ev_motor: {
    label: 'EV Motor',
    short: 'EV Motor',
    unitIcon: '⚡',
    params: [
      { key: 'temperature', label: 'Motor Temperature', unit: '°C', baseline: 42, warnAt: 58, critAt: 75, weight: 0.25 },
      { key: 'vibration', label: 'Vibration', unit: 'g', baseline: 1.8, warnAt: 3.4, critAt: 5.2, weight: 0.25 },
      { key: 'current', label: 'Current', unit: 'A', baseline: 18.4, warnAt: 32, critAt: 45, weight: 0.20 },
      { key: 'voltage', label: 'Voltage', unit: 'V', baseline: 48.2, warnAt: 44, critAt: 40, direction: 'higher_better', weight: 0.10 },
      { key: 'cycles', label: 'RPM', unit: '', baseline: 3420, weight: 0.20, isCounter: false, ratePerTick: 0 },
    ],
    demo: {
      normal: { temperature: 42, vibration: 1.8, current: 18.4, voltage: 48.2 },
      warning: { temperature: 56, vibration: 3.6, current: 29, voltage: 45.1 },
      critical: { temperature: 71, vibration: 5.0, current: 41, voltage: 41.3 },
    },
  },
  ev_battery: {
    label: 'EV Battery',
    short: 'EV Battery',
    unitIcon: '🔋',
    params: [
      { key: 'soh', label: 'State of Health', unit: '%', baseline: 91, warnAt: 80, critAt: 65, direction: 'higher_better', weight: 0.40 },
      { key: 'temperature', label: 'Battery Temperature', unit: '°C', baseline: 36, warnAt: 48, critAt: 60, weight: 0.25 },
      { key: 'current', label: 'Current', unit: 'A', baseline: 12.4, warnAt: 24, critAt: 34, weight: 0.15 },
      { key: 'voltage', label: 'Voltage', unit: 'V', baseline: 48.2, warnAt: 44, critAt: 40, direction: 'higher_better', weight: 0.20 },
      { key: 'soc', label: 'State of Charge', unit: '%', baseline: 78, direction: 'higher_better', weight: 0, isCounter: false },
      { key: 'cycles', label: 'Charge Cycles', unit: '', baseline: 421, weight: 0, isCounter: true, ratePerTick: 0.02 },
    ],
    demo: {
      normal: { soh: 91, temperature: 36, current: 12.4, voltage: 48.2, soc: 78 },
      warning: { soh: 82, temperature: 47, current: 23, voltage: 44.8, soc: 61 },
      critical: { soh: 68, temperature: 58, current: 31, voltage: 41.0, soc: 34 },
    },
  },
  pump: {
    label: 'Pump',
    short: 'Pump',
    unitIcon: '💧',
    params: [
      { key: 'temperature', label: 'Temperature', unit: '°C', baseline: 44, warnAt: 60, critAt: 78, weight: 0.25 },
      { key: 'vibration', label: 'Vibration', unit: 'g', baseline: 2.6, warnAt: 4.6, critAt: 7.0, weight: 0.40 },
      { key: 'current', label: 'Current', unit: 'A', baseline: 5.1, warnAt: 9.0, critAt: 13.0, weight: 0.15 },
      { key: 'cycles', label: 'Operating Hours', unit: '', baseline: 3120, weight: 0.20, isCounter: true, ratePerTick: 2 },
    ],
    demo: {
      normal: { temperature: 44, vibration: 2.6, current: 5.1 },
      warning: { temperature: 59, vibration: 4.9, current: 8.4 },
      critical: { temperature: 74, vibration: 7.2, current: 12.1 },
    },
  },
  compressor: {
    label: 'Compressor',
    short: 'Compressor',
    unitIcon: '🌀',
    params: [
      { key: 'temperature', label: 'Discharge Temperature', unit: '°C', baseline: 52, warnAt: 70, critAt: 90, weight: 0.30 },
      { key: 'vibration', label: 'Vibration', unit: 'g', baseline: 2.9, warnAt: 5.0, critAt: 7.5, weight: 0.35 },
      { key: 'current', label: 'Current', unit: 'A', baseline: 6.8, warnAt: 11.5, critAt: 16.0, weight: 0.15 },
      { key: 'cycles', label: 'Duty Cycles', unit: '', baseline: 2210, weight: 0.20, isCounter: true, ratePerTick: 2.4 },
    ],
    demo: {
      normal: { temperature: 52, vibration: 2.9, current: 6.8 },
      warning: { temperature: 68, vibration: 5.3, current: 10.6 },
      critical: { temperature: 86, vibration: 7.9, current: 15.2 },
    },
  },
  generator: {
    label: 'Generator',
    short: 'Generator',
    unitIcon: '🔌',
    params: [
      { key: 'temperature', label: 'Winding Temperature', unit: '°C', baseline: 58, warnAt: 75, critAt: 95, weight: 0.25 },
      { key: 'vibration', label: 'Vibration', unit: 'g', baseline: 3.0, warnAt: 5.2, critAt: 7.8, weight: 0.30 },
      { key: 'current', label: 'Load Current', unit: 'A', baseline: 22.0, warnAt: 38, critAt: 52, weight: 0.25 },
      { key: 'cycles', label: 'Run Hours', unit: '', baseline: 5480, weight: 0.20, isCounter: true, ratePerTick: 3 },
    ],
    demo: {
      normal: { temperature: 58, vibration: 3.0, current: 22.0 },
      warning: { temperature: 73, vibration: 5.6, current: 35 },
      critical: { temperature: 91, vibration: 8.1, current: 48 },
    },
  },
}

// Demo fleet shown on the Assets page / asset selector.
export const ASSETS = [
  { id: 'AST-IND-001', type: 'industrial_motor', name: 'Industrial Motor — Line 3', installed: '2026', primary: true },
  { id: 'AST-EVM-002', type: 'ev_motor', name: 'EV Motor — Test Rig A', installed: '2026' },
  { id: 'AST-EVB-003', type: 'ev_battery', name: 'EV Battery Pack — Rig A', installed: '2026' },
  { id: 'AST-PMP-004', type: 'pump', name: 'Pump — Coolant Loop 2', installed: '2025' },
  { id: 'AST-CMP-005', type: 'compressor', name: 'Compressor — Bay 1', installed: '2025' },
  { id: 'AST-GEN-006', type: 'generator', name: 'Generator — Backup Unit', installed: '2024' },
]

// Fixed "reference" health values for assets other than the one currently
// being driven by Demo Mode, so the Assets / Analytics pages stay stable.
export const REFERENCE_HEALTH = {
  'AST-IND-001': 87,
  'AST-EVM-002': 92,
  'AST-EVB-003': 91,
  'AST-PMP-004': 74,
  'AST-CMP-005': 88,
  'AST-GEN-006': 95,
}

export const REFERENCE_STATUS = {
  'AST-IND-001': 'healthy',
  'AST-EVM-002': 'healthy',
  'AST-EVB-003': 'healthy',
  'AST-PMP-004': 'warning',
  'AST-CMP-005': 'healthy',
  'AST-GEN-006': 'healthy',
}
