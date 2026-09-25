export type SensorReading = {
  id: number;
  device_id: string;
  pm1_0: number | null;
  pm2_5: number | null;
  pm10: number | null;
  mq135: number | null;
  mq135_digital: number | null;
  rain: number | null;
  rain_digital: number | null;
  rain_status: string | null;
  gas_status: string | null;
  motor_status: boolean;
  manual_mode: boolean;
  is_demo: boolean;
  created_at: string;
};

export type Device = {
  id: string;
  device_name: string;
  location: string | null;
  status: string;
  last_seen: string | null;
  manual_mode: boolean;
  motor_command: boolean;
  motor_status: boolean;
};

export type Alert = {
  id: number;
  device_id: string;
  alert_type: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY" | string;
  sensor_name: string | null;
  sensor_value: number | null;
  threshold_value: number | null;
  previous_value: number | null;
  title: string;
  message: string | null;
  status: string;
  is_demo: boolean;
  created_at: string;
};
