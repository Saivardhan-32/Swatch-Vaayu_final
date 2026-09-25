/**
 * SWATCH VAAYU — single place for all thresholds and tuning values.
 * Change a number here and the whole app (cards, alerts, motor rule) follows.
 */

export const DEVICE_ID = "SV001";

/** Motor turns ON automatically at or above this PM2.5 value (µg/m³). */
export const MOTOR_PM25_THRESHOLD = 200;

/** Device is considered offline if no reading arrives within this many seconds. */
export const OFFLINE_AFTER_SECONDS = 60;

/** A reading counts as a sudden spike if it rises this % above the previous one. */
export const SPIKE_PERCENT = 50;

/** Minimum PM2.5 value before spike detection applies (ignores tiny fluctuations). */
export const SPIKE_MIN_VALUE = 35;

/** Minutes to wait before the same alert can fire again. */
export const ALERT_COOLDOWN_MINUTES = 15;

/** PM2.5 alert levels. */
export const PM25_ALERT_LEVELS = [
  { severity: "EMERGENCY", value: 350 },
  { severity: "CRITICAL", value: 200 },
  { severity: "WARNING", value: 100 },
] as const;

export type StatusLabel =
  | "GOOD"
  | "MODERATE"
  | "POOR"
  | "HAZARD"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "VERY HIGH"
  | "DRY"
  | "LIGHT RAIN"
  | "RAIN"
  | "HEAVY RAIN"
  | "NO DATA";

export type StatusTone = "good" | "moderate" | "poor" | "hazard" | "info" | "muted";

export const STATUS_TONE: Record<StatusLabel, StatusTone> = {
  GOOD: "good",
  MODERATE: "moderate",
  POOR: "poor",
  HAZARD: "hazard",
  LOW: "good",
  MEDIUM: "moderate",
  HIGH: "poor",
  "VERY HIGH": "hazard",
  DRY: "good",
  "LIGHT RAIN": "info",
  RAIN: "info",
  "HEAVY RAIN": "info",
  "NO DATA": "muted",
};

function band(
  value: number | null | undefined,
  bands: [number, StatusLabel][],
  last: StatusLabel,
): StatusLabel {
  if (value === null || value === undefined || Number.isNaN(value)) return "NO DATA";
  for (const [limit, label] of bands) {
    if (value <= limit) return label;
  }
  return last;
}

export const pm1Status = (v?: number | null) =>
  band(v, [
    [50, "GOOD"],
    [100, "MODERATE"],
    [200, "POOR"],
  ], "HAZARD");

export const pm25Status = (v?: number | null) =>
  band(v, [
    [50, "GOOD"],
    [100, "MODERATE"],
    [200, "POOR"],
  ], "HAZARD");

export const pm10Status = (v?: number | null) =>
  band(v, [
    [50, "GOOD"],
    [100, "MODERATE"],
    [250, "POOR"],
  ], "HAZARD");

export const mq135Status = (v?: number | null) =>
  band(v, [
    [999, "LOW"],
    [1999, "MEDIUM"],
    [2999, "HIGH"],
  ], "VERY HIGH");

export function rainStatus(v?: number | null): StatusLabel {
  if (v === null || v === undefined || Number.isNaN(v)) return "NO DATA";
  if (v < 1200) return "HEAVY RAIN";
  if (v < 2500) return "RAIN";
  if (v < 3500) return "LIGHT RAIN";
  return "DRY";
}

/** PM2.5 alert severity for a value, or null when below the first level. */
export function pm25Severity(value: number): "WARNING" | "CRITICAL" | "EMERGENCY" | null {
  for (const level of PM25_ALERT_LEVELS) {
    if (value >= level.value) return level.severity;
  }
  return null;
}
