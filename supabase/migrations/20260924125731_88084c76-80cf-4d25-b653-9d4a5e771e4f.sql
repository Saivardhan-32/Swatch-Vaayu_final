CREATE TABLE public.devices (
  id TEXT PRIMARY KEY,
  device_name TEXT NOT NULL DEFAULT 'Swatch Vaayu Node',
  location TEXT,
  status TEXT NOT NULL DEFAULT 'OFFLINE',
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  pm1_0 NUMERIC,
  pm2_5 NUMERIC,
  pm10 NUMERIC,
  mq135 NUMERIC,
  mq135_digital INTEGER,
  rain NUMERIC,
  rain_digital INTEGER,
  rain_status TEXT,
  gas_status TEXT,
  motor_status BOOLEAN NOT NULL DEFAULT false,
  manual_mode BOOLEAN NOT NULL DEFAULT false,
  temperature NUMERIC,
  humidity NUMERIC,
  battery_voltage NUMERIC,
  battery_soc NUMERIC,
  battery_soh NUMERIC,
  solar_voltage NUMERIC,
  solar_current NUMERIC,
  solar_power NUMERIC,
  filter_health NUMERIC,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sensor_readings_device_time_idx ON public.sensor_readings (device_id, created_at DESC);

CREATE TABLE public.alerts (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO',
  sensor_name TEXT,
  sensor_value NUMERIC,
  threshold_value NUMERIC,
  previous_value NUMERIC,
  title TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX alerts_time_idx ON public.alerts (created_at DESC);

CREATE TABLE public.alert_rules (
  id BIGSERIAL PRIMARY KEY,
  sensor_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  spike_percent NUMERIC NOT NULL DEFAULT 50,
  cooldown_minutes INTEGER NOT NULL DEFAULT 15,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.devices TO anon, authenticated;
GRANT INSERT, UPDATE ON public.devices TO anon, authenticated;
GRANT ALL ON public.devices TO service_role;
GRANT SELECT, INSERT ON public.sensor_readings TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.sensor_readings_id_seq TO anon, authenticated;
GRANT ALL ON public.sensor_readings TO service_role;
GRANT ALL ON SEQUENCE public.sensor_readings_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.alerts TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.alerts_id_seq TO anon, authenticated;
GRANT ALL ON public.alerts TO service_role;
GRANT ALL ON SEQUENCE public.alerts_id_seq TO service_role;
GRANT SELECT ON public.alert_rules TO anon, authenticated;
GRANT ALL ON public.alert_rules TO service_role;

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices_read" ON public.devices FOR SELECT USING (true);
CREATE POLICY "devices_insert" ON public.devices FOR INSERT WITH CHECK (true);
CREATE POLICY "devices_update" ON public.devices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "readings_read" ON public.sensor_readings FOR SELECT USING (true);
CREATE POLICY "readings_insert" ON public.sensor_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "alerts_read" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "alerts_insert" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "alerts_update" ON public.alerts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "rules_read" ON public.alert_rules FOR SELECT USING (true);

INSERT INTO public.devices (id, device_name, location, status)
VALUES ('SV001', 'Swatch Vaayu Node 1', 'College Campus', 'OFFLINE');

INSERT INTO public.alert_rules (sensor_name, severity, threshold_value) VALUES
  ('pm2_5', 'WARNING', 100),
  ('pm2_5', 'CRITICAL', 200),
  ('pm2_5', 'EMERGENCY', 350);

ALTER TABLE public.sensor_readings REPLICA IDENTITY FULL;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;