ALTER TABLE public.devices
  ADD COLUMN manual_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN motor_command BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN motor_status BOOLEAN NOT NULL DEFAULT false;