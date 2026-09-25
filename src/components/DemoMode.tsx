import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEVICE_ID } from "@/lib/sv-config";

type Preset = { label: string; body: Record<string, unknown> };

const presets: Preset[] = [
  { label: "Normal", body: { pm1_0: 28, pm2_5: 42, pm10: 60, mq135: 800, rain: 3800 } },
  { label: "High PM2.5", body: { pm1_0: 90, pm2_5: 150, pm10: 180, mq135: 1400, rain: 3800 } },
  { label: "Sudden Spike", body: { pm1_0: 120, pm2_5: 260, pm10: 300, mq135: 1800, rain: 3800 } },
  { label: "Hazard", body: { pm1_0: 210, pm2_5: 380, pm10: 420, mq135: 2600, rain: 3700 } },
  { label: "Heavy Rain", body: { pm1_0: 20, pm2_5: 30, pm10: 45, mq135: 700, rain: 900 } },
  { label: "High Gas", body: { pm1_0: 40, pm2_5: 60, pm10: 90, mq135: 3200, rain: 3800 } },
];

export function DemoMode() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  async function send(preset: Preset) {
    setBusy(preset.label);
    try {
      const res = await fetch("/api/public/sensor-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: DEVICE_ID, ...preset.body, is_demo: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Demo reading sent: ${preset.label}`);
      qc.invalidateQueries();
    } catch {
      toast.error("Could not send the demo reading.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-dashed border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <FlaskConical className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Demo mode</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Sends clearly marked DEMO readings so you can show the system without the hardware running.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => send(p)}
          >
            {busy === p.label ? "Sending…" : p.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
