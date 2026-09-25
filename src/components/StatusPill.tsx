import { STATUS_TONE, type StatusLabel, type StatusTone } from "@/lib/sv-config";
import { cn } from "@/lib/utils";

const toneClass: Record<StatusTone, string> = {
  good: "bg-good-soft text-good",
  moderate: "bg-moderate-soft text-moderate",
  poor: "bg-poor-soft text-poor",
  hazard: "bg-hazard-soft text-hazard",
  info: "bg-info-soft text-info",
  muted: "bg-muted text-muted-foreground",
};

export function StatusPill({
  status,
  className,
}: {
  status: StatusLabel | string;
  className?: string;
}) {
  const tone = STATUS_TONE[status as StatusLabel] ?? "muted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        toneClass[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
