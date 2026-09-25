import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecentReadings } from "@/hooks/useLiveData";

const LEVELS = [200, 150, 100];
const levelOf = (v: number | null | undefined) =>
  v === null || v === undefined ? 0 : (LEVELS.find((l) => v >= l) ?? 0);

let audioCtx: AudioContext | null = null;

function playAlarm(level: number) {
  if (!audioCtx) return;
  const beeps = level >= 200 ? 5 : level >= 150 ? 3 : 2;
  const now = audioCtx.currentTime;
  for (let i = 0; i < beeps; i++) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = level >= 200 ? 1000 : 800;
    gain.gain.setValueAtTime(0.25, now + i * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.4 + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + i * 0.4);
    osc.stop(now + i * 0.4 + 0.3);
  }
}

/** Plays a sound and shows a pop-up when PM2.5 climbs above 100, 150 or 200. */
export function PollutionAlarm() {
  const { data: readings = [] } = useRecentReadings(120);
  const lastId = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(localStorage.getItem("sv-sound") === "on" && audioCtx !== null);
  }, []);

  function enable() {
    audioCtx = audioCtx ?? new AudioContext();
    audioCtx.resume();
    localStorage.setItem("sv-sound", "on");
    setEnabled(true);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    playAlarm(100);
    toast.success("Sound alerts are on");
  }

  useEffect(() => {
    const latest = readings[readings.length - 1];
    if (!latest) return;
    if (lastId.current === null) {
      lastId.current = latest.id; // don't alarm for old readings on page load
      return;
    }
    if (latest.id === lastId.current) return;
    const prev = readings.find((r) => r.id === lastId.current) ?? readings[readings.length - 2];
    lastId.current = latest.id;
    const level = levelOf(latest.pm2_5);
    if (level > levelOf(prev?.pm2_5)) {
      const text = `PM2.5 is ${latest.pm2_5} µg/m³ — above ${level}.${level >= 200 ? " Motor activated." : ""}`;
      playAlarm(level);
      toast.error(`⚠️ Pollution alert`, { description: text, duration: 15000 });
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("⚠️ Swatch Vaayu", { body: text });
        } catch {
          /* some mobile browsers only allow notifications from an installed app */
        }
      }
    }
  }, [readings]);

  if (enabled) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <p className="text-sm text-foreground">
        Turn on sound alerts for PM2.5 above 100, 150 and 200.
      </p>
      <Button size="sm" onClick={enable}>
        <BellRing className="size-4" /> Enable sound alerts
      </Button>
    </div>
  );
}
