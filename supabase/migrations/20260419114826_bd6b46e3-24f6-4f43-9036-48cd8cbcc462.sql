
-- Recreate views without SECURITY DEFINER (use security_invoker so they respect caller RLS)
DROP VIEW IF EXISTS public.dashboard_region_stats;
CREATE VIEW public.dashboard_region_stats
WITH (security_invoker = true) AS
SELECT
  region_name,
  COUNT(*)::bigint AS total,
  ROUND((COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM public.vehicle_detections), 0)) * 100, 2) AS percentage
FROM public.vehicle_detections
WHERE region_name IS NOT NULL
GROUP BY region_name;

DROP VIEW IF EXISTS public.dashboard_vehicle_type_stats;
CREATE VIEW public.dashboard_vehicle_type_stats
WITH (security_invoker = true) AS
SELECT
  vehicle_type,
  COUNT(*)::bigint AS total
FROM public.vehicle_detections
WHERE vehicle_type IS NOT NULL
GROUP BY vehicle_type;

-- Fix mutable search_path on existing function
CREATE OR REPLACE FUNCTION public.get_detections_by_date_range(start_date timestamp with time zone, end_date timestamp with time zone)
 RETURNS TABLE(id uuid, vehicle_type text, detected_at timestamp with time zone, plate_number text, region_name text)
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    vd.id,
    vd.vehicle_type,
    vd.detected_at,
    vd.plate_number,
    vd.region_name
  FROM vehicle_detections vd
  WHERE vd.detected_at BETWEEN start_date AND end_date
  ORDER BY vd.detected_at DESC;
END;
$function$;
