import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  ALERT_COOLDOWN_MINUTES,
  MOTOR_PM25_THRESHOLD,
  OFFLINE_AFTER_SECONDS,
  SPIKE_MIN_VALUE,
  SPIKE_PERCENT,
  mq135Status,
  pm25Severity,
  rainStatus,
} from "@/lib/sv-config";

const payloadSchema = z.object({
  device_id: z.string().min(1).default("SV001"),
  pm1_0: z.number().nullable().optional(),
  pm2_5: z.number().nullable().optional(),
  pm10: z.number().nullable().optional(),
  mq135: z.number().nullable().optional(),
  mq135_digital: z.number().nullable().optional(),
  rain: z.number().nullable().optional(),
  rain_digital: z.number().nullable().optional(),
  rain_status: z.string().nullable().optional(),
  gas_status: z.string().nullable().optional(),
  motor_status: z.boolean().optional(),
  manual_mode: z.boolean().optional(),
  is_demo: z.boolean().optional(),
});

function client() {
  const url =
    (import.meta as any).env?.VITE_SUPABASE_URL ?? process.env["VITE_SUPABASE_URL"]!;
  const key =
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const SMS_LEVELS = [200, 150, 100];
const smsLevel = (v: number) => SMS_LEVELS.find((l) => v >= l) ?? 0;

async function sendSms(text: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  const from = process.env["TWILIO_FROM_NUMBER"];
  const to = process.env["ALERT_PHONE_NUMBER"];
  if (!lovableKey || !twilioKey || !from || !to) {
    console.error("SMS not sent: missing Twilio settings");
    return;
  }
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: text }),
    });
    if (!res.ok) console.error(`SMS failed [${res.status}]: ${await res.text()}`);
  } catch (e) {
    console.error("SMS error", e);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

export const Route = createFileRoute("/api/public/sensor-data")({
  server: {
    handlers: {
      OPTIONS: () =>
        new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "content-type",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          },
        }),
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        const parsed = payloadSchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Invalid payload", details: parsed.error.issues }, 400);
        }
        const data = parsed.data;
        const db = client();

        const { data: device } = await db
          .from("devices")
          .select("*")
          .eq("id", data.device_id)
          .maybeSingle();

        if (!device) return json({ error: "Unknown device_id" }, 404);

        const wasOffline =
          !device.last_seen ||
          Date.now() - new Date(device.last_seen).getTime() > OFFLINE_AFTER_SECONDS * 1000;

        const pm25 = data.pm2_5 ?? null;
        const manualMode = device.manual_mode as boolean;
        const motorOn = manualMode
          ? (device.motor_command as boolean)
          : pm25 !== null && pm25 >= MOTOR_PM25_THRESHOLD;

        const isDemo = data.is_demo ?? false;

        const { data: inserted, error: insertError } = await db
          .from("sensor_readings")
          .insert({
            device_id: data.device_id,
            pm1_0: data.pm1_0 ?? null,
            pm2_5: pm25,
            pm10: data.pm10 ?? null,
            mq135: data.mq135 ?? null,
            mq135_digital: data.mq135_digital ?? null,
            rain: data.rain ?? null,
            rain_digital: data.rain_digital ?? null,
            rain_status: data.rain_status ?? rainStatus(data.rain),
            gas_status: data.gas_status ?? mq135Status(data.mq135),
            motor_status: motorOn,
            manual_mode: manualMode,
            is_demo: isDemo,
          })
          .select()
          .single();

        if (insertError) return json({ error: insertError.message }, 500);

        await db
          .from("devices")
          .update({
            status: "ONLINE",
            last_seen: new Date().toISOString(),
            motor_status: motorOn,
          })
          .eq("id", data.device_id);

        const alerts: Record<string, unknown>[] = [];

        if (wasOffline) {
          alerts.push({
            device_id: data.device_id,
            alert_type: "DEVICE_ONLINE",
            severity: "INFO",
            sensor_name: "device",
            title: "DEVICE ONLINE",
            message: "The ESP32 device is sending data again.",
            status: "RESOLVED",
            is_demo: isDemo,
          });
        }

        if (pm25 !== null) {
          // Previous reading (the one before the row we just inserted)
          const { data: prevRows } = await db
            .from("sensor_readings")
            .select("pm2_5, created_at")
            .eq("device_id", data.device_id)
            .lt("id", inserted.id)
            .order("id", { ascending: false })
            .limit(1);
          const previous = prevRows?.[0]?.pm2_5 ?? null;

          const severity = pm25Severity(pm25);
          const prevSeverity = previous !== null ? pm25Severity(previous) : null;

          const since = new Date(
            Date.now() - ALERT_COOLDOWN_MINUTES * 60 * 1000,
          ).toISOString();
          const { data: recent } = await db
            .from("alerts")
            .select("alert_type, severity, created_at")
            .eq("device_id", data.device_id)
            .gte("created_at", since);

          const firedRecently = (type: string, sev?: string) =>
            (recent ?? []).some((a) => a.alert_type === type && (!sev || a.severity === sev));

          // Threshold crossing (only when the level actually changed upward)
          if (severity && severity !== prevSeverity && !firedRecently("THRESHOLD", severity)) {
            alerts.push({
              device_id: data.device_id,
              alert_type: "THRESHOLD",
              severity,
              sensor_name: "pm2_5",
              sensor_value: pm25,
              threshold_value:
                severity === "EMERGENCY" ? 350 : severity === "CRITICAL" ? 200 : 100,
              previous_value: previous,
              title: severity === "WARNING" ? "RISING POLLUTION" : "HIGH POLLUTION ALERT",
              message:
                `PM2.5 crossed ${severity === "EMERGENCY" ? 350 : severity === "CRITICAL" ? 200 : 100} µg/m³. ` +
                `Current value: ${pm25} µg/m³.` +
                (severity !== "WARNING" ? " Motor automatically activated." : ""),
              status: "ACTIVE",
              is_demo: isDemo,
            });
          }

          // Recovery
          if (!severity && prevSeverity && !firedRecently("RECOVERY")) {
            alerts.push({
              device_id: data.device_id,
              alert_type: "RECOVERY",
              severity: "INFO",
              sensor_name: "pm2_5",
              sensor_value: pm25,
              threshold_value: 100,
              previous_value: previous,
              title: "AIR QUALITY NORMAL",
              message: `PM2.5 has returned to ${pm25} µg/m³. Motor back to standby in automatic mode.`,
              status: "RESOLVED",
              is_demo: isDemo,
            });
          }

          // Sudden spike
          if (
            previous !== null &&
            previous > 0 &&
            pm25 >= SPIKE_MIN_VALUE &&
            pm25 >= previous * (1 + SPIKE_PERCENT / 100) &&
            !firedRecently("SPIKE")
          ) {
            const pct = Math.round(((pm25 - previous) / previous) * 100);
            alerts.push({
              device_id: data.device_id,
              alert_type: "SPIKE",
              severity: "WARNING",
              sensor_name: "pm2_5",
              sensor_value: pm25,
              previous_value: previous,
              title: "SUDDEN PM2.5 INCREASE",
              message: `PM2.5 increased by ${pct}% — from ${previous} to ${pm25} µg/m³.`,
              status: "ACTIVE",
              is_demo: isDemo,
            });
          }
          // SMS when PM2.5 climbs into a higher level (100, 150, 200+)
          const level = smsLevel(pm25);
          const prevLevel = previous !== null ? smsLevel(previous) : 0;
          if (level > prevLevel) {
            await sendSms(
              `${isDemo ? "[DEMO] " : ""}Swatch Vaayu alert: PM2.5 is ${pm25} µg/m³ (above ${level}).` +
                (level >= 200 ? " Motor activated." : ""),
            );
          }
        }

        if (alerts.length) await db.from("alerts").insert(alerts);

        return json({
          ok: true,
          reading_id: inserted.id,
          motor: motorOn,
          manual_mode: manualMode,
          alerts_created: alerts.length,
        });
      },
    },
  },
});
