# SWATCH VAAYU — Smart Air. Cleaner Streets.

A simple web app that shows live and historical data from an ESP32 air-quality
station (PMS5003, MQ-135, rain sensor, relay-driven motor).

## Pages

- **Dashboard** — device online/offline, live sensor cards, motor control, live trend graph, today's statistics, recent alerts, demo mode
- **History** — 1h / 6h / 24h / 7d / 30d graphs, statistics per sensor, CSV export
- **Alerts** — threshold crossings, sudden spikes, recoveries and device events with filters

## Run locally

```bash
npm install
npm run dev
```

## ESP32 setup

1. Open `esp32/swatch_vaayu.ino` in the Arduino IDE.
2. Install libraries: `ArduinoJson`, `LiquidCrystal_I2C`.
3. Set `WIFI_SSID` and `WIFI_PASS` at the top of the file.
4. Upload to the ESP32. Pins are unchanged:
   PMS5003 RX 16 / TX 17, rain A34 / D35, MQ-135 A32 / D33, relay 23 (active LOW).

The board posts a reading every 10 seconds to:

```
POST /api/public/sensor-data
{
  "device_id": "SV001",
  "pm1_0": 40, "pm2_5": 82, "pm10": 120,
  "mq135": 1400, "mq135_digital": 1,
  "rain": 3500, "rain_digital": 1,
  "rain_status": "DRY", "gas_status": "MEDIUM",
  "motor_status": false, "manual_mode": false
}
```

The response returns `{ "motor": bool, "manual_mode": bool }` so the website can
take over the relay in manual mode.

## Thresholds

All thresholds, the spike percentage (default 50%), the alert cooldown
(default 15 minutes) and the motor rule (PM2.5 ≥ 200 µg/m³) live in
`src/lib/sv-config.ts`.

## Testing without hardware

Use the **Demo mode** buttons on the dashboard. Demo readings and alerts are
stored with a `DEMO` marker so they are never confused with real measurements.
