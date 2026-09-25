import type { LucideIcon } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";

export function SensorCard({
  label,
  value,
  unit,
  status,
  icon: Icon,
  note,
}: {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  status?: string;
  icon: LucideIcon;
  note?: string;
}) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold text-foreground">
          {hasValue ? value : "—"}
        </span>
        {unit && hasValue && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {status && <StatusPill status={status} className="mt-3" />}
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
