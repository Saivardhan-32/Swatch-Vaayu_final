import { AlertTriangle, CheckCircle2, Info, Siren } from "lucide-react";
import type { Alert } from "@/lib/sv-types";

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return new Date(iso).toLocaleString();
}

const styles: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  INFO: { icon: Info, color: "text-info", bg: "bg-info-soft" },
  WARNING: { icon: AlertTriangle, color: "text-moderate", bg: "bg-moderate-soft" },
  CRITICAL: { icon: Siren, color: "text-poor", bg: "bg-poor-soft" },
  EMERGENCY: { icon: Siren, color: "text-hazard", bg: "bg-hazard-soft" },
};

export function AlertItem({ alert }: { alert: Alert }) {
  const recovery = alert.alert_type === "RECOVERY" || alert.alert_type === "DEVICE_ONLINE";
  const style = recovery
    ? { icon: CheckCircle2, color: "text-good", bg: "bg-good-soft" }
    : (styles[alert.severity] ?? styles["INFO"]!);
  const Icon = style.icon;

  return (
    <li className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
        <Icon className={`size-4 ${style.color}`} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{alert.title}</p>
          {alert.is_demo && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              DEMO
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{alert.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(alert.created_at)}</p>
      </div>
    </li>
  );
}
