import type { SensorReading } from "@/lib/sv-types";

export type NumberStats = {
  current: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  count: number;
};

export function numberStats(
  readings: SensorReading[],
  key: keyof SensorReading,
): NumberStats {
  const values = readings
    .map((r) => r[key])
    .filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(Number(v)))
    .map(Number);

  if (values.length === 0) {
    return { current: null, average: null, min: null, max: null, count: 0 };
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    current: values[values.length - 1] ?? null,
    average: Math.round((sum / values.length) * 10) / 10,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}

/** Minutes the motor was ON, based on the gaps between recorded readings. */
export function motorStats(readings: SensorReading[]) {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  let onMs = 0;
  let activations = 0;
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    const prev = sorted[i - 1];
    if (cur.motor_status && (!prev || !prev.motor_status)) activations += 1;
    if (prev && prev.motor_status) {
      onMs += new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime();
    }
  }
  return { minutes: Math.round(onMs / 60000), activations };
}

export function rainStats(readings: SensorReading[]) {
  const statuses = readings.map((r) => r.rain_status).filter(Boolean) as string[];
  const counts = new Map<string, number>();
  for (const s of statuses) counts.set(s, (counts.get(s) ?? 0) + 1);
  let most: string | null = null;
  let best = 0;
  for (const [s, c] of counts) {
    if (c > best) {
      best = c;
      most = s;
    }
  }
  let events = 0;
  for (let i = 1; i < statuses.length; i++) {
    const wasWet = statuses[i - 1] !== "DRY";
    const isWet = statuses[i] !== "DRY";
    if (wasWet !== isWet) events += 1;
  }
  return { current: statuses[statuses.length - 1] ?? null, most, events };
}

export function toCsv(readings: SensorReading[]) {
  const cols: (keyof SensorReading)[] = [
    "created_at",
    "pm1_0",
    "pm2_5",
    "pm10",
    "mq135",
    "mq135_digital",
    "rain",
    "rain_digital",
    "rain_status",
    "gas_status",
    "motor_status",
    "manual_mode",
    "is_demo",
  ];
  const head = cols.join(",");
  const rows = readings.map((r) => cols.map((c) => String(r[c] ?? "")).join(","));
  return [head, ...rows].join("\n");
}
