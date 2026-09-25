import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, CloudRain, Droplets, Gauge, Wind } from "lucide-react";
import { SensorCard } from "@/components/SensorCard";
import { SensorChart } from "@/components/SensorChart";
import { MotorControl } from "@/components/MotorControl";
import { DemoMode } from "@/components/DemoMode";
import { AlertItem } from "@/components/AlertItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  isOnline,
  useAlerts,
  useDevice,
  useRealtimeRefresh,
  useRecentReadings,
} from "@/hooks/useLiveData";
import { mq135Status, pm10Status, pm1Status, pm25Status, rainStatus } from "@/lib/sv-config";
import { motorStats, numberStats } from "@/lib/stats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Swatch Vaayu" },
      {
        name: "description",
        content:
          "Live PM1.0, PM2.5, PM10, gas and rain readings from the Swatch Vaayu ESP32 station, with motor control.",
      },
      { property: "og:title", content: "Dashboard — Swatch Vaayu" },
      {
        property: "og:description",
        content: "Live air quality readings and motor control for the Swatch Vaayu station.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  useRealtimeRefresh();
  const { data: device } = useDevice();
  const { data: readings = [] } = useRecentReadings(120);
  const { data: alerts = [] } = useAlerts(5);
  const [, forceTick] = useState(0);
  const notified = useRef<Set<number>>(new Set());

  // Re-render every 10s so the online/offline badge stays accurate.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 10000);
    return () => clearInterval(t);
  }, []);

  // Browser notification, once per critical alert.
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const critical = alerts.filter(
      (a) => a.severity === "CRITICAL" || a.severity === "EMERGENCY",
    );
    if (critical.length === 0) return;
    const fire = () => {
      for (const a of critical) {
        if (notified.current.has(a.id)) continue;
        notified.current.add(a.id);
        if (Date.now() - new Date(a.created_at).getTime() > 5 * 60 * 1000) continue;
        new Notification("🚨 Swatch Vaayu", { body: `${a.title}\n${a.message ?? ""}` });
      }
    };
    if (Notification.permission === "granted") fire();
    else if (Notification.permission === "default")
      Notification.requestPermission().then((p) => p === "granted" && fire());
  }, [alerts]);

  const latest = readings[readings.length - 1] ?? null;
  const online = isOnline(device?.last_seen);
  const motorOn = device?.motor_status ?? latest?.motor_status ?? false;

  const today = readings.filter(
    (r) => new Date(r.created_at).toDateString() === new Date().toDateString(),
  );
  const pm25Today = numberStats(today, "pm2_5");
  const motor = motorStats(today);
  const alertsToday = alerts.filter(
    (a) => new Date(a.created_at).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SWATCH VAAYU</h1>
            <p className="text-sm text-muted-foreground">Smart Air. Cleaner Streets.</p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                online ? "bg-good-soft text-good" : "bg-poor-soft text-poor"
              }`}
            >
              <span className="size-2 rounded-full bg-current" />
              {online ? "ONLINE" : "OFFLINE"}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated:{" "}
              {latest ? new Date(latest.created_at).toLocaleTimeString() : "no data yet"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SensorCard
          label="PM1.0"
          value={latest?.pm1_0 ?? null}
          unit="µg/m³"
          status={pm1Status(latest?.pm1_0)}
          icon={Droplets}
        />
        <SensorCard
          label="PM2.5"
          value={latest?.pm2_5 ?? null}
          unit="µg/m³"
          status={pm25Status(latest?.pm2_5)}
          icon={Wind}
        />
        <SensorCard
          label="PM10"
          value={latest?.pm10 ?? null}
          unit="µg/m³"
          status={pm10Status(latest?.pm10)}
          icon={Gauge}
        />
        <SensorCard
          label="MQ-135"
          value={latest?.mq135 ?? null}
          unit="ADC"
          status={mq135Status(latest?.mq135)}
          icon={Activity}
          note="Raw ADC value — not calibrated ppm"
        />
        <SensorCard
          label="Rain"
          value={latest?.rain ?? null}
          unit="ADC"
          status={latest?.rain_status ?? rainStatus(latest?.rain)}
          icon={CloudRain}
        />
        <MotorControl device={device ?? null} motorOn={motorOn} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-foreground">Live trend</h2>
        <Tabs defaultValue="pm2_5">
          <TabsList>
            <TabsTrigger value="pm2_5">PM2.5</TabsTrigger>
            <TabsTrigger value="pm10">PM10</TabsTrigger>
            <TabsTrigger value="mq135">MQ-135</TabsTrigger>
            <TabsTrigger value="rain">Rain</TabsTrigger>
          </TabsList>
          <TabsContent value="pm2_5">
            <SensorChart readings={readings} dataKey="pm2_5" unit="µg/m³" />
          </TabsContent>
          <TabsContent value="pm10">
            <SensorChart readings={readings} dataKey="pm10" unit="µg/m³" />
          </TabsContent>
          <TabsContent value="mq135">
            <SensorChart readings={readings} dataKey="mq135" unit="ADC" />
          </TabsContent>
          <TabsContent value="rain">
            <SensorChart readings={readings} dataKey="rain" unit="ADC" />
          </TabsContent>
        </Tabs>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Today's readings" value={today.length} />
        <MiniStat label="Average PM2.5" value={pm25Today.average ?? "—"} suffix="µg/m³" />
        <MiniStat label="Peak PM2.5" value={pm25Today.max ?? "—"} suffix="µg/m³" />
        <MiniStat label="Alerts today" value={alertsToday} />
        <MiniStat label="Motor runtime" value={motor.minutes} suffix="min" />
        <MiniStat label="Activations" value={motor.activations} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-foreground">Recent alerts</h2>
        {alerts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No alerts yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <AlertItem key={a.id} alert={a} />
            ))}
          </ul>
        )}
      </section>

      <DemoMode />
    </div>
  );
}

function MiniStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">
        {value}
        {suffix && <span className="ml-1 text-xs font-normal text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}
