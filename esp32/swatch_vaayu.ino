/*
  SWATCH VAAYU — ESP32 firmware with cloud upload
  ------------------------------------------------
  Hardware pins (unchanged):
    PMS5003 : RX = GPIO16, TX = GPIO17 (Serial2)
    Rain    : analog = GPIO34, digital = GPIO35
    MQ-135  : analog = GPIO32, digital = GPIO33
    Relay   : GPIO23 (ACTIVE LOW)
    LCD     : I2C 16x2 at 0x27 (SDA 21, SCL 22)

  Automatic rule: PM2.5 >= 200 µg/m³ -> motor ON, otherwise OFF.
  The website can take over with manual mode; the server replies with the
  motor command in every upload response.

  Libraries: WiFi, HTTPClient, ArduinoJson, LiquidCrystal_I2C
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ---------------- USER SETTINGS ----------------
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* API_URL =
  "https://project--9ec2c8a1-73d7-4ed0-8bb5-004e9613f81c.lovable.app/api/public/sensor-data";
const char* DEVICE_ID = "SV001";
const unsigned long UPLOAD_INTERVAL_MS = 10000;  // 10 seconds
// -----------------------------------------------

#define PMS_RX 16
#define PMS_TX 17
#define RAIN_A 34
#define RAIN_D 35
#define MQ_A   32
#define MQ_D   33
#define RELAY  23

#define PM25_MOTOR_THRESHOLD 200

LiquidCrystal_I2C lcd(0x27, 16, 2);

int pm1 = 0, pm25 = 0, pm10 = 0;
bool manualMode = false;
bool motorCommand = false;
bool motorOn = false;
unsigned long lastUpload = 0;

// ---------- PMS5003 with checksum validation ----------
bool readPMS() {
  uint8_t buf[32];
  unsigned long start = millis();
  while (millis() - start < 1500) {
    if (Serial2.available() >= 32) {
      if (Serial2.read() != 0x42) continue;
      if (Serial2.read() != 0x4D) continue;
      buf[0] = 0x42;
      buf[1] = 0x4D;
      Serial2.readBytes(&buf[2], 30);

      uint16_t sum = 0;
      for (int i = 0; i < 30; i++) sum += buf[i];
      uint16_t checksum = (buf[30] << 8) | buf[31];
      if (sum != checksum) return false;

      pm1  = (buf[10] << 8) | buf[11];
      pm25 = (buf[12] << 8) | buf[13];
      pm10 = (buf[14] << 8) | buf[15];
      return true;
    }
  }
  return false;
}

String rainStatus(int adc) {
  if (adc < 1200) return "HEAVY RAIN";
  if (adc < 2500) return "RAIN";
  if (adc < 3500) return "LIGHT RAIN";
  return "DRY";
}

String gasStatus(int adc) {
  if (adc < 1000) return "LOW";
  if (adc < 2000) return "MEDIUM";
  if (adc < 3000) return "HIGH";
  return "VERY HIGH";
}

void setMotor(bool on) {
  motorOn = on;
  digitalWrite(RELAY, on ? LOW : HIGH);  // relay is ACTIVE LOW
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, PMS_RX, PMS_TX);

  pinMode(RAIN_D, INPUT);
  pinMode(MQ_D, INPUT);
  pinMode(RELAY, OUTPUT);
  setMotor(false);

  lcd.init();
  lcd.backlight();
  lcd.print("SWATCH VAAYU");

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  lcd.setCursor(0, 1);
  lcd.print("WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  lcd.setCursor(0, 1);
  lcd.print("WiFi OK        ");
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
}

void uploadReading(int rainA, int rainD, int mqA, int mqD) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["pm1_0"] = pm1;
  doc["pm2_5"] = pm25;
  doc["pm10"] = pm10;
  doc["mq135"] = mqA;
  doc["mq135_digital"] = mqD;
  doc["rain"] = rainA;
  doc["rain_digital"] = rainD;
  doc["rain_status"] = rainStatus(rainA);
  doc["gas_status"] = gasStatus(mqA);
  doc["motor_status"] = motorOn;
  doc["manual_mode"] = manualMode;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code == 200) {
    StaticJsonDocument<256> res;
    if (!deserializeJson(res, http.getString())) {
      manualMode = res["manual_mode"] | false;
      motorCommand = res["motor"] | false;
    }
  } else {
    Serial.printf("Upload failed: %d\n", code);
  }
  http.end();
}

void loop() {
  bool ok = readPMS();
  int rainA = analogRead(RAIN_A);
  int rainD = digitalRead(RAIN_D);
  int mqA = analogRead(MQ_A);
  int mqD = digitalRead(MQ_D);

  // Motor control: manual command from the website, else the automatic rule.
  if (manualMode) setMotor(motorCommand);
  else setMotor(pm25 >= PM25_MOTOR_THRESHOLD);

  lcd.setCursor(0, 0);
  lcd.printf("PM2.5:%4d %s", pm25, motorOn ? "M:ON " : "M:OFF");
  lcd.setCursor(0, 1);
  lcd.printf("GAS:%4d %-7s", mqA, rainStatus(rainA).c_str());

  if (millis() - lastUpload >= UPLOAD_INTERVAL_MS) {
    lastUpload = millis();
    if (ok) uploadReading(rainA, rainD, mqA, mqD);
  }

  delay(1000);
}
