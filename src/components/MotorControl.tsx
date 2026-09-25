import { useQueryClient } from "@tanstack/react-query";
import { Fan, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { setMotorMode } from "@/lib/supabase-queries";
import { MOTOR_PM25_THRESHOLD } from "@/lib/sv-config";
import type { Device } from "@/lib/sv-types";

export function MotorControl({ device, motorOn }: { device: Device | null; motorOn: boolean }) {
  const qc = useQueryClient();
  const manual = device?.manual_mode ?? false;

  async function update(nextManual: boolean, nextMotor: boolean) {
    await setMotorMode(nextManual, nextMotor);
    qc.invalidateQueries({ queryKey: ["device"] });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Fan className={`size-5 ${motorOn ? "text-good" : "text-muted-foreground"}`} />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Motor</p>
            <p className="text-xl font-semibold text-foreground">{motorOn ? "ON" : "OFF"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Automatic</span>
          <Switch
            checked={manual}
            onCheckedChange={(checked) => update(checked, device?.motor_command ?? false)}
            aria-label="Switch between automatic and manual mode"
          />
          <span className="text-sm text-muted-foreground">Manual</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {manual
          ? "Motor is controlled manually."
          : `Motor automatically activates when PM2.5 reaches ${MOTOR_PM25_THRESHOLD} µg/m³.`}
      </p>

      {manual && (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant={device?.motor_command ? "default" : "outline"}
            onClick={() => update(true, true)}
          >
            <Power className="mr-1 size-4" /> Turn ON
          </Button>
          <Button
            size="sm"
            variant={!device?.motor_command ? "default" : "outline"}
            onClick={() => update(true, false)}
          >
            <Power className="mr-1 size-4" /> Turn OFF
          </Button>
        </div>
      )}
    </div>
  );
}
