export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alert_rules: {
        Row: {
          cooldown_minutes: number
          created_at: string
          enabled: boolean
          id: number
          sensor_name: string
          severity: string
          spike_percent: number
          threshold_value: number
        }
        Insert: {
          cooldown_minutes?: number
          created_at?: string
          enabled?: boolean
          id?: number
          sensor_name: string
          severity: string
          spike_percent?: number
          threshold_value: number
        }
        Update: {
          cooldown_minutes?: number
          created_at?: string
          enabled?: boolean
          id?: number
          sensor_name?: string
          severity?: string
          spike_percent?: number
          threshold_value?: number
        }
        Relationships: []
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          device_id: string
          id: number
          is_demo: boolean
          message: string | null
          notified: boolean
          previous_value: number | null
          sensor_name: string | null
          sensor_value: number | null
          severity: string
          status: string
          threshold_value: number | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          device_id: string
          id?: number
          is_demo?: boolean
          message?: string | null
          notified?: boolean
          previous_value?: number | null
          sensor_name?: string | null
          sensor_value?: number | null
          severity?: string
          status?: string
          threshold_value?: number | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          device_id?: string
          id?: number
          is_demo?: boolean
          message?: string | null
          notified?: boolean
          previous_value?: number | null
          sensor_name?: string | null
          sensor_value?: number | null
          severity?: string
          status?: string
          threshold_value?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          device_name: string
          id: string
          last_seen: string | null
          location: string | null
          manual_mode: boolean
          motor_command: boolean
          motor_status: boolean
          status: string
        }
        Insert: {
          created_at?: string
          device_name?: string
          id: string
          last_seen?: string | null
          location?: string | null
          manual_mode?: boolean
          motor_command?: boolean
          motor_status?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          device_name?: string
          id?: string
          last_seen?: string | null
          location?: string | null
          manual_mode?: boolean
          motor_command?: boolean
          motor_status?: boolean
          status?: string
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
          battery_soc: number | null
          battery_soh: number | null
          battery_voltage: number | null
          created_at: string
          device_id: string
          filter_health: number | null
          gas_status: string | null
          humidity: number | null
          id: number
          is_demo: boolean
          manual_mode: boolean
          motor_status: boolean
          mq135: number | null
          mq135_digital: number | null
          pm1_0: number | null
          pm10: number | null
          pm2_5: number | null
          rain: number | null
          rain_digital: number | null
          rain_status: string | null
          solar_current: number | null
          solar_power: number | null
          solar_voltage: number | null
          temperature: number | null
        }
        Insert: {
          battery_soc?: number | null
          battery_soh?: number | null
          battery_voltage?: number | null
          created_at?: string
          device_id: string
          filter_health?: number | null
          gas_status?: string | null
          humidity?: number | null
          id?: number
          is_demo?: boolean
          manual_mode?: boolean
          motor_status?: boolean
          mq135?: number | null
          mq135_digital?: number | null
          pm1_0?: number | null
          pm10?: number | null
          pm2_5?: number | null
          rain?: number | null
          rain_digital?: number | null
          rain_status?: string | null
          solar_current?: number | null
          solar_power?: number | null
          solar_voltage?: number | null
          temperature?: number | null
        }
        Update: {
          battery_soc?: number | null
          battery_soh?: number | null
          battery_voltage?: number | null
          created_at?: string
          device_id?: string
          filter_health?: number | null
          gas_status?: string | null
          humidity?: number | null
          id?: number
          is_demo?: boolean
          manual_mode?: boolean
          motor_status?: boolean
          mq135?: number | null
          mq135_digital?: number | null
          pm1_0?: number | null
          pm10?: number | null
          pm2_5?: number | null
          rain?: number | null
          rain_digital?: number | null
          rain_status?: string | null
          solar_current?: number | null
          solar_power?: number | null
          solar_voltage?: number | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
