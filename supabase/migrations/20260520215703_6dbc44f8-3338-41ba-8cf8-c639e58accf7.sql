ALTER TABLE public.vehicle_detections DROP COLUMN IF EXISTS region_id;
ALTER TABLE public.vehicle_detections ADD COLUMN subregion_name text;