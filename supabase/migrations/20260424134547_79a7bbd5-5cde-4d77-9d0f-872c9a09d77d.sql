
ALTER TABLE public.vehicle_detections DISABLE TRIGGER vehicle_detections_error_trigger;

DROP POLICY IF EXISTS "temp_seed_insert" ON public.vehicle_detections;
CREATE POLICY "temp_seed_insert" ON public.vehicle_detections
  FOR INSERT TO authenticated WITH CHECK (true);

DO $$
DECLARE
  cam_id uuid;
  day_offset int;
  day_date date;
  detection_count int;
  i int;
  rand_val numeric;
  selected_region_id int;
  selected_region_name text;
  selected_region_code text;
  selected_vehicle_type text;
  plate_letters text;
  plate_number_val text;
  plate_suffix text;
  detection_time timestamptz;
  hour_val int;
  minute_val int;
  second_val int;
  region_pool text[] := ARRAY[
    'Kota Semarang','Kota Semarang','Kota Semarang','Kota Semarang','Kota Semarang',
    'Kota Semarang','Kota Semarang','Kota Semarang',
    'Kabupaten Semarang','Kabupaten Semarang','Kabupaten Semarang','Kabupaten Semarang',
    'Kota Salatiga','Kota Salatiga','Kota Salatiga',
    'Kabupaten Kendal','Kabupaten Kendal',
    'Kabupaten Demak','Kabupaten Demak',
    'Kabupaten Grobogan',
    'Kota Surakarta','Kota Surakarta','Kota Surakarta','Kota Surakarta',
    'Kabupaten Boyolali','Kabupaten Boyolali','Kabupaten Boyolali',
    'Kabupaten Klaten','Kabupaten Klaten',
    'Kabupaten Sukoharjo','Kabupaten Sukoharjo',
    'Kabupaten Karanganyar',
    'Kabupaten Sragen',
    'Kota Yogyakarta','Kota Yogyakarta','Kota Yogyakarta','Kota Yogyakarta',
    'Kabupaten Sleman','Kabupaten Sleman','Kabupaten Sleman',
    'Kabupaten Bantul','Kabupaten Bantul',
    'Kota Magelang','Kabupaten Magelang','Kabupaten Magelang',
    'Kabupaten Temanggung','Kabupaten Purworejo',
    'Kabupaten Pati','Kabupaten Kudus','Kabupaten Jepara',
    'Kabupaten Banyumas','Kabupaten Cilacap',
    'Kota Pekalongan','Kabupaten Tegal',
    'DKI Jakarta','DKI Jakarta','DKI Jakarta',
    'Kota Bandung','Kota Bandung',
    'Kabupaten Bogor','Kabupaten Cirebon','Kota Tangerang',
    'Kota Surabaya','Kota Surabaya',
    'Kota Malang','Kabupaten Madiun',
    'Sumatera Utara','Bali','Sumatera Selatan'
  ];
  region_codes_map jsonb := '{
    "Kota Semarang":"H","Kota Salatiga":"H","Kabupaten Semarang":"H","Kabupaten Kendal":"H","Kabupaten Demak":"H","Kabupaten Grobogan":"H",
    "Kota Surakarta":"AD","Kabupaten Boyolali":"AD","Kabupaten Klaten":"AD","Kabupaten Sukoharjo":"AD","Kabupaten Karanganyar":"AD","Kabupaten Sragen":"AD",
    "Kota Yogyakarta":"AB","Kabupaten Sleman":"AB","Kabupaten Bantul":"AB",
    "Kota Magelang":"AA","Kabupaten Magelang":"AA","Kabupaten Temanggung":"AA","Kabupaten Purworejo":"AA",
    "Kabupaten Pati":"K","Kabupaten Kudus":"K","Kabupaten Jepara":"K",
    "Kabupaten Banyumas":"R","Kabupaten Cilacap":"R",
    "Kota Pekalongan":"G","Kabupaten Tegal":"G",
    "DKI Jakarta":"B","Kota Bandung":"D","Kabupaten Bogor":"F","Kabupaten Cirebon":"E","Kota Tangerang":"A",
    "Kota Surabaya":"L","Kota Malang":"N","Kabupaten Madiun":"AE","Kabupaten Kediri":"AG",
    "Sumatera Utara":"BK","Sumatera Selatan":"BG","Sumatera Barat":"BA","Riau":"BM",
    "Bali":"DK","Sulawesi Selatan":"DD","Kalimantan Timur":"KT"
  }'::jsonb;
  bus_inserted boolean := false;
  total_days int := 30;
BEGIN
  SELECT id INTO cam_id FROM public.cameras LIMIT 1;

  FOR day_offset IN 0..(total_days - 1) LOOP
    day_date := (CURRENT_DATE - day_offset);
    detection_count := 33 + floor(random() * 6)::int;

    FOR i IN 1..detection_count LOOP
      rand_val := random();

      IF rand_val < 0.92 THEN
        selected_vehicle_type := 'Mobil';
      ELSIF rand_val < 0.99 THEN
        selected_vehicle_type := 'Lainnya';
      ELSE
        IF NOT bus_inserted THEN
          selected_vehicle_type := 'Bus';
          bus_inserted := true;
        ELSE
          selected_vehicle_type := 'Mobil';
        END IF;
      END IF;

      selected_region_name := region_pool[1 + floor(random() * array_length(region_pool, 1))::int];
      selected_region_code := region_codes_map ->> selected_region_name;

      SELECT id INTO selected_region_id FROM public.regions
        WHERE name = selected_region_name LIMIT 1;

      plate_letters := chr(65 + floor(random()*26)::int) ||
                       chr(65 + floor(random()*26)::int) ||
                       CASE WHEN random() > 0.3 THEN chr(65 + floor(random()*26)::int) ELSE '' END;
      plate_suffix := lpad((1 + floor(random()*9999))::text, 4, '0');
      plate_number_val := selected_region_code || ' ' || plate_suffix || ' ' || plate_letters;

      hour_val := 10 + floor(random() * 12)::int;
      minute_val := floor(random() * 60)::int;
      second_val := floor(random() * 60)::int;
      detection_time := (day_date::text || ' ' || hour_val::text || ':' ||
                         lpad(minute_val::text, 2, '0') || ':' ||
                         lpad(second_val::text, 2, '0'))::timestamptz;

      INSERT INTO public.vehicle_detections
        (camera_id, plate_number, vehicle_type, region_id, region_name, detected_at, confidence)
      VALUES
        (cam_id, plate_number_val, selected_vehicle_type, selected_region_id,
         selected_region_name, detection_time, 0.85 + random() * 0.14);
    END LOOP;
  END LOOP;

  IF NOT bus_inserted THEN
    INSERT INTO public.vehicle_detections
      (camera_id, plate_number, vehicle_type, region_id, region_name, detected_at, confidence)
    VALUES
      (cam_id, 'AD 7421 BUS', 'Bus',
       (SELECT id FROM public.regions WHERE name='Kota Surakarta' LIMIT 1),
       'Kota Surakarta',
       (CURRENT_DATE - 5)::timestamptz + interval '14 hours 23 minutes', 0.94);
  END IF;
END $$;

DROP POLICY IF EXISTS "temp_seed_insert" ON public.vehicle_detections;
ALTER TABLE public.vehicle_detections ENABLE TRIGGER vehicle_detections_error_trigger;
