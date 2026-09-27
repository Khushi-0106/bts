/*
 ==============================================================================
  MechSight — AIoT Machine Condition Intelligence
  Physical ESP32 Sensor Telemetry Firmware
 ==============================================================================
  Hardware Connections:
  1. DS18B20 Digital Temperature Sensor:
     - VCC -> 3.3V / 5V
     - GND -> GND
     - DATA -> GPIO 4 (with 4.7k ohm pull-up resistor between DATA and VCC)
  
  2. Infrared Optical Sensor (LM393 / TCRT5000):
     - VCC -> 3.3V / 5V
     - GND -> GND
     - OUT -> GPIO 18 (Interrupt-driven optical cycle & RPM counter)

  3. MPU6050 6-DOF Accelerometer / Vibration Sensor (Optional / Plug-and-Play):
     - VCC -> 3.3V
     - GND -> GND
     - SDA -> GPIO 21
     - SCL -> GPIO 22

  Required Arduino IDE Libraries:
  - OneWire by Jim Studt, Paul Stoffregen
  - DallasTemperature by Miles Burton
  - ArduinoJson (Version 6 or 7) by Benoit Blanchon
  - Adafruit MPU6050 & Adafruit Unified Sensor (Optional)
 ==============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>

// ============================================================================
// CONFIGURATION — ENTER YOUR NETWORK CREDENTIALS & SERVER IP HERE
// ============================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";          // Enter your Wi-Fi Name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";      // Enter your Wi-Fi Password

// Use your computer's LAN IP address (Detected: http://192.168.1.8:5000/api/sensors)
const char* SERVER_URL    = "http://192.168.1.8:5000/api/sensors"; 

const char* DEVICE_ID     = "ESP32-001";
const char* ASSET_ID      = "MOTOR-001";

// Pin Definitions
#define ONE_WIRE_BUS 4     // DS18B20 Data Pin
#define IR_SENSOR_PIN 18   // IR Optical Sensor Digital Out

// ============================================================================
// SENSOR INSTANCES & VARIABLES
// ============================================================================
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);

// IR Sensor Interrupt Variables
volatile unsigned long pulseCounter = 0;
unsigned long totalAccumulatedCycles = 0;
volatile unsigned long lastPulseTime = 0;

// Timing Variables
unsigned long lastTransmissionTime = 0;
const unsigned long TRANSMISSION_INTERVAL_MS = 1000; // Send reading every 1 second
unsigned long lastRpmCalcTime = 0;
float currentRpm = 0.0;

bool mpuAvailable = false;

// Interrupt Service Routine for IR Optical Sensor
void IRAM_ATTR onOpticalPulse() {
  unsigned long now = micros();
  // Debounce 2ms to prevent optical noise
  if (now - lastPulseTime > 2000) {
    pulseCounter++;
    totalAccumulatedCycles++;
    lastPulseTime = now;
  }
}

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=======================================================");
  Serial.println("  MechSight AIoT Hardware Node Initializing...");
  Serial.println("=======================================================");

  // 1. Initialize DS18B20 Temperature Sensor
  ds18b20.begin();
  int tempSensorCount = ds18b20.getDeviceCount();
  Serial.print("[Sensor] DS18B20 Temperature Sensors Detected: ");
  Serial.println(tempSensorCount);

  // 2. Initialize IR Optical Sensor Pin
  pinMode(IR_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(IR_SENSOR_PIN), onOpticalPulse, FALLING);
  Serial.println("[Sensor] IR Optical Speed/Cycle Sensor Attached to GPIO 18.");

  // 3. Probe I2C Bus for MPU6050
  Wire.begin(21, 22);
  Wire.beginTransmission(0x68);
  if (Wire.endTransmission() == 0) {
    mpuAvailable = true;
    Serial.println("[Sensor] MPU6050 I2C Accelerometer Detected at 0x68.");
    // Wake up MPU6050
    Wire.beginTransmission(0x68);
    Wire.write(0x6B); // PWR_MGMT_1 register
    Wire.write(0);    // set to zero (wakes up the MPU-6050)
    Wire.endTransmission(true);
  } else {
    mpuAvailable = false;
    Serial.println("[Sensor] MPU6050 not detected on I2C (vibration will report null).");
  }

  // 4. Connect to Wi-Fi
  Serial.print("\n[Wi-Fi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] ESP32 Local IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[Wi-Fi] Target Server: ");
    Serial.println(SERVER_URL);
  } else {
    Serial.println("\n[Wi-Fi] Failed to connect. Sensor acquisition will run in offline mode.");
  }
  Serial.println("=======================================================\n");

  lastRpmCalcTime = millis();
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  unsigned long now = millis();

  // Reconnect Wi-Fi if dropped
  if (WiFi.status() != WL_CONNECTED && (now % 10000 < 50)) {
    WiFi.reconnect();
  }

  // Calculate RPM and send telemetry every TRANSMISSION_INTERVAL_MS
  if (now - lastTransmissionTime >= TRANSMISSION_INTERVAL_MS) {
    unsigned long interval = now - lastTransmissionTime;
    lastTransmissionTime = now;

    // 1. Calculate RPM from optical pulses
    noInterrupts();
    unsigned long pulses = pulseCounter;
    pulseCounter = 0;
    interrupts();

    // Assuming 1 pulse per revolution (or adjust for slotted disc slots e.g. 2, 4)
    // Formula: (pulses / slots) * (60000.0 / intervalMs)
    const float SLOTS_PER_REV = 1.0; 
    currentRpm = (pulses / SLOTS_PER_REV) * (60000.0 / (float)interval);

    // 2. Read DS18B20 Temperature
    ds18b20.requestTemperatures();
    float temperature = ds18b20.getTempCByIndex(0);
    bool validTemp = (temperature > -40.0 && temperature < 125.0);

    // 3. Read MPU6050 Vibration if present
    float vibrationVal = 0.0;
    bool hasVib = false;
    if (mpuAvailable) {
      Wire.beginTransmission(0x68);
      Wire.write(0x3B); // starting with register 0x3B (ACCEL_XOUT_H)
      if (Wire.endTransmission(false) == 0 && Wire.requestFrom(0x68, 6, true) == 6) {
        int16_t ax = Wire.read() << 8 | Wire.read();
        int16_t ay = Wire.read() << 8 | Wire.read();
        int16_t az = Wire.read() << 8 | Wire.read();
        // Convert to g (assuming +-2g scale = 16384 LSB/g)
        float gx = ax / 16384.0;
        float gy = ay / 16384.0;
        float gz = az / 16384.0;
        vibrationVal = sqrt(gx * gx + gy * gy + gz * gz);
        hasVib = true;
      }
    }

    // 4. Print formatted Serial Log
    Serial.println("-------------------------------------------------------");
    Serial.printf("Time: %lu ms | Device: %s | Asset: %s\n", now, DEVICE_ID, ASSET_ID);
    if (validTemp) {
      Serial.printf("🌡 Temperature: %.1f °C [DS18B20]\n", temperature);
    } else {
      Serial.println("🌡 Temperature: DISCONNECTED / ERROR");
    }
    Serial.printf("🔄 Speed: %.0f RPM | Total Cycles: %lu [IR Optical]\n", currentRpm, totalAccumulatedCycles);
    if (hasVib) {
      Serial.printf("〰 Vibration: %.2f g [MPU6050]\n", vibrationVal);
    } else {
      Serial.println("〰 Vibration: SENSOR NOT CONNECTED (null)");
    }

    // 5. Send HTTP POST to MechSight Server
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      http.setTimeout(1500); // 1.5s non-blocking timeout

      StaticJsonDocument<384> doc;
      doc["assetId"] = ASSET_ID;
      doc["deviceId"] = DEVICE_ID;
      doc["rotationDetected"] = (currentRpm > 0 || pulses > 0);
      doc["rpm"] = (int)currentRpm;
      doc["cycleCount"] = totalAccumulatedCycles;

      if (validTemp) {
        doc["temperature"] = serialized(String(temperature, 1));
      } else {
        doc["temperature"] = nullptr;
      }

      if (hasVib) {
        doc["vibration"] = serialized(String(vibrationVal, 2));
      } else {
        doc["vibration"] = nullptr;
      }

      doc["current"] = nullptr;
      doc["voltage"] = nullptr;
      doc["dataSource"] = "REAL_SENSOR";

      String payload;
      serializeJson(doc, payload);

      int httpResponseCode = http.POST(payload);
      if (httpResponseCode > 0) {
        Serial.printf("📡 Telemetry Sent -> Server Response: %d\n", httpResponseCode);
      } else {
        Serial.printf("⚠️ Server unreachable: %s (Acquisition continues)\n", http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    } else {
      Serial.println("⚠️ Wi-Fi Offline: Sensor data logged locally.");
    }
  }

  delay(10); // Yield to background tasks
}
