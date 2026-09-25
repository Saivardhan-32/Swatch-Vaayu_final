import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SensorChart } from "@/components/SensorChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeRefresh } from "@/hooks/useLiveData";
import { fetchReadingsSince } from "@/lib/supabase-queries";
import { motorStats, numberStats, rainStats, toCsv } from "@/lib/stats";

const ranges = [
  { label: "Last 1 hour", hours: 1 },
  { label: "Last 6 hours", hours: 6 },
  { label: "Last 24 hours", hours: 24 },
  { label: "Last 7 days", hours: 24 * 7 },
  { label: "Last 30 days", hours: 24 * 30 },
];

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Swatch Vaayu" },
      {
        name: "description",
        content:
          "Historical air quality graphs and statistics for PM1.0, PM2.5, PM10, gas and rain, with CSV export.",
      },
      { property: "og:title", content: "History — Swatch Vaayu" },
      {
        property: "og:description",
        content: "Historical sensor graphs and statistics from the Swatch Vaayu station.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  useRealtimeRefresh();
  const [hours, setHours] = useState(24);
  const { data: readings = [], isLoading } = useQuery({
    queryKey: ["history", hours],
    queryFn: () => fetchReadingsSince(hours),
  });

  const rain = rainStats(readings);
  const motor = motorStats(readings);

  function exportCsv() {
    const blob = new Blob([toCsv(readings)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swatch-vaayu-${hours}h.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">History</h1>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={readings.length === 0}>
          <Download className="mr-1 size-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ranges.map((r) => (
          <Button
            key={r.hours}
            size="sm"
            variant={hours === r.hours ? "default" : "outline"}
            onClick={() => setHours(r.hours)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : readings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No historical data available yet.
        </p>
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <Tabs defaultValue="pm2_5">
              <TabsList className="flex-wrap">
                <TabsTrigger value="pm1_0">PM1.0</TabsTrigger>
                <TabsTrigger value="pm2_5">PM2.5</TabsTrigger>
                <TabsTrigger value="pm10">PM10</TabsTrigger>
                <TabsTrigger value="mq135">MQ-135</TabsTrigger>
                <TabsTrigger value="rain">Rain</TabsTrigger>
              </TabsList>
              <TabsContent value="pm1_0">
                <SensorChart readings={readings} dataKey="pm1_0" unit="µg/m³" />
              </TabsContent>
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

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="PM1.0 (µg/m³)" stats={numberStats(readings, "pm1_0")} />
            <StatsCard title="PM2.5 (µg/m³)" stats={numberStats(readings, "pm2_5")} />
            <StatsCard title="PM10 (µg/m³)" stats={numberStats(readings, "pm10")} />
            <StatsCard title="MQ-135 (ADC)" stats={numberStats(readings, "mq135")} />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">Rain</h3>
              <Row label="Current status" value={rain.current ?? "—"} />
              <Row label="Most frequent" value={rain.most ?? "—"} />
              <Row label="Wet / dry events" value={rain.events} />
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">Motor</h3>
              <Row label="ON time" value={`${motor.minutes} min`} />
              <Row label="Activations" value={motor.activations} />
              <Row label="Readings stored" value={readings.length} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatsCard({
  title,
  stats,
}: {
  title: string;
  stats: ReturnType<typeof numberStats>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <Row label="Current" value={stats.current ?? "—"} />
      <Row label="Average" value={stats.average ?? "—"} />
      <Row label="Minimum" value={stats.min ?? "—"} />
      <Row label="Maximum" value={stats.max ?? "—"} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="mt-2 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
