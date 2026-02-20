
-- Allow anon SELECT on users table (for custom login)
CREATE POLICY "anon_read_users"
ON public.users
FOR SELECT
TO anon
USING (true);

-- Allow anon SELECT on cameras
CREATE POLICY "anon_read_cameras"
ON public.cameras
FOR SELECT
TO anon
USING (true);

-- Allow anon SELECT on vehicle_detections
CREATE POLICY "anon_read_detections"
ON public.vehicle_detections
FOR SELECT
TO anon
USING (true);

-- Allow anon SELECT on weekly_exports
CREATE POLICY "anon_read_exports"
ON public.weekly_exports
FOR SELECT
TO anon
USING (true);

-- Enable RLS and allow anon SELECT on regions
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_regions"
ON public.regions
FOR SELECT
TO anon
USING (true);

-- Enable RLS and allow anon SELECT on dashboard_region_stats (view)
-- Views inherit RLS from underlying tables, but we need to ensure access
-- For views, we grant SELECT directly
GRANT SELECT ON public.dashboard_region_stats TO anon;
GRANT SELECT ON public.dashboard_vehicle_type_stats TO anon;
