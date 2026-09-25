import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAlerts,
  fetchDevice,
  fetchRecentReadings,
} from "@/lib/supabase-queries";
import { OFFLINE_AFTER_SECONDS } from "@/lib/sv-config";

/** Subscribes once to live table changes and refreshes the cached queries. */
export function useRealtimeRefresh() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("swatch-vaayu")
      .on("postgres_changes", { event: "*", schema: "public", table: "sensor_readings" }, () => {
        qc.invalidateQueries({ queryKey: ["readings"] });
        qc.invalidateQueries({ queryKey: ["history"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        qc.invalidateQueries({ queryKey: ["alerts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, () => {
        qc.invalidateQueries({ queryKey: ["device"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useDevice() {
  return useQuery({ queryKey: ["device"], queryFn: fetchDevice, refetchInterval: 20000 });
}

export function useRecentReadings(limit = 60) {
  return useQuery({
    queryKey: ["readings", limit],
    queryFn: () => fetchRecentReadings(limit),
    refetchInterval: 20000,
  });
}

export function useAlerts(limit = 100) {
  return useQuery({ queryKey: ["alerts", limit], queryFn: () => fetchAlerts(limit) });
}

export function isOnline(lastSeen: string | null | undefined) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < OFFLINE_AFTER_SECONDS * 1000;
}
