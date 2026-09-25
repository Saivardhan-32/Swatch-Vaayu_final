import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertItem } from "@/components/AlertItem";
import { useAlerts, useRealtimeRefresh } from "@/hooks/useLiveData";

const filters = ["All", "Critical", "Warning", "Recovered"] as const;
type Filter = (typeof filters)[number];

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — Swatch Vaayu" },
      {
        name: "description",
        content:
          "Threshold crossings, sudden pollution spikes, device offline events and recovery notices from the Swatch Vaayu station.",
      },
      { property: "og:title", content: "Alerts — Swatch Vaayu" },
      {
        property: "og:description",
        content: "Pollution threshold, spike and recovery alerts from the Swatch Vaayu station.",
      },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  useRealtimeRefresh();
  const { data: alerts = [], isLoading } = useAlerts(200);
  const [filter, setFilter] = useState<Filter>("All");

  const visible = alerts.filter((a) => {
    if (filter === "All") return true;
    if (filter === "Critical") return a.severity === "CRITICAL" || a.severity === "EMERGENCY";
    if (filter === "Warning") return a.severity === "WARNING";
    return a.alert_type === "RECOVERY" || a.alert_type === "DEVICE_ONLINE";
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">Alerts</h1>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No alerts to show.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((a) => (
            <AlertItem key={a.id} alert={a} />
          ))}
        </ul>
      )}
    </div>
  );
}
