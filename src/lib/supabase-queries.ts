import { supabase } from "@/integrations/supabase/client";
import { DEVICE_ID } from "@/lib/sv-config";
import type { Alert, Device, SensorReading } from "@/lib/sv-types";

export async function fetchDevice(): Promise<Device | null> {
  const { data } = await supabase.from("devices").select("*").eq("id", DEVICE_ID).maybeSingle();
  return (data as Device | null) ?? null;
}

export async function fetchRecentReadings(limit = 60): Promise<SensorReading[]> {
  const { data } = await supabase
    .from("sensor_readings")
    .select("*")
    .eq("device_id", DEVICE_ID)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as SensorReading[]).reverse();
}

export async function fetchReadingsSince(hours: number): Promise<SensorReading[]> {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from("sensor_readings")
    .select("*")
    .eq("device_id", DEVICE_ID)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(5000);
  return (data ?? []) as SensorReading[];
}

export async function fetchAlerts(limit = 100): Promise<Alert[]> {
  const { data } = await supabase
    .from("alerts")
    .select("*")
    .eq("device_id", DEVICE_ID)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Alert[];
}

export async function setMotorMode(manual: boolean, motorOn: boolean) {
  await supabase
    .from("devices")
    .update({ manual_mode: manual, motor_command: motorOn })
    .eq("id", DEVICE_ID);
}
