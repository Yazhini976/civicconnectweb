-- ================================================================
-- GARBAGE MONITORING — Seed Data
-- Migration: 003_garbage_seed.sql
-- Municipality Route Data (Tamil Nadu)
-- ================================================================

-- ── Trucks ──────────────────────────────────────────────────────
INSERT INTO garbage_trucks (vehicle_name, vehicle_type, registration_number, driver_name, driver_phone, gps_device_id, ward_number, status, is_active)
VALUES
    ('PC-1',  'Push Cart',      'TN-39-AA-1001', 'Ramesh Kumar',   '9876501001', 'GPS-PC1-001',  '4', 'inactive', true),
    ('PC-2',  'Push Cart',      'TN-39-AA-1002', 'Suresh Babu',    '9876501002', 'GPS-PC2-002',  '4', 'inactive', true),
    ('PC-3',  'Push Cart',      'TN-39-AA-1003', 'Muthu Raj',      '9876501003', 'GPS-PC3-003',  '5', 'inactive', true),
    ('BOV-1', 'Battery Vehicle','TN-39-BB-2001', 'Anbarasu',       '9876502001', 'GPS-BOV1-001', '4', 'inactive', true),
    ('BOV-2', 'Battery Vehicle','TN-39-BB-2002', 'Selvam',         '9876502002', 'GPS-BOV2-002', '5', 'inactive', true),
    ('AC-1',  'Auto Compactor', 'TN-39-CC-3001', 'Kannan',         '9876503001', 'GPS-AC1-001',  '6', 'inactive', true),
    ('AC-2',  'Auto Compactor', 'TN-39-CC-3002', 'Vijayakumar',    '9876503002', 'GPS-AC2-002',  '7', 'inactive', true),
    ('TC-1',  'Tractor',        'TN-39-DD-4001', 'Balamurugan',    '9876504001', 'GPS-TC1-001',  '8', 'inactive', true)
ON CONFLICT (vehicle_name) DO NOTHING;

-- ── Routes (WKT MultiLineString geometries) ──────────────────────
-- These are realistic coordinate paths for the municipality streets

-- PC-1: Ward 4 — Kambar Katta Street N/S
INSERT INTO garbage_routes (vehicle_name, ward_number, street_names, households, workers, route_geometry, total_length_meters)
VALUES (
    'PC-1', '4',
    ARRAY['Kambar Katta Street North', 'Kambar Katta Street South', 'Cross Street 1'],
    145, 3,
    ST_GeomFromText(
      'MULTILINESTRING(
        (77.8250 10.7850, 77.8255 10.7870, 77.8260 10.7890, 77.8265 10.7910, 77.8270 10.7930),
        (77.8270 10.7930, 77.8265 10.7920, 77.8260 10.7905, 77.8255 10.7885, 77.8250 10.7860),
        (77.8250 10.7860, 77.8270 10.7860)
      )', 4326),
    820
)
ON CONFLICT (vehicle_name) DO UPDATE SET
    route_geometry = EXCLUDED.route_geometry,
    street_names   = EXCLUDED.street_names,
    households     = EXCLUDED.households,
    workers        = EXCLUDED.workers;

-- PC-2: Ward 4 — Perumal Kovil Street area
INSERT INTO garbage_routes (vehicle_name, ward_number, street_names, households, workers, route_geometry, total_length_meters)
VALUES (
    'PC-2', '4',
    ARRAY['Perumal Kovil Street', 'Manimegalai Street', 'Valayapathy Street', 'Sindhamani Street'],
    178, 3,
    ST_GeomFromText(
      'MULTILINESTRING(
        (77.8280 10.7840, 77.8285 10.7855, 77.8290 10.7870, 77.8295 10.7885, 77.8300 10.7900),
        (77.8300 10.7900, 77.8310 10.7900, 77.8320 10.7900, 77.8330 10.7900),
        (77.8330 10.7900, 77.8330 10.7885, 77.8330 10.7870, 77.8330 10.7855),
        (77.8330 10.7855, 77.8315 10.7855, 77.8300 10.7855, 77.8285 10.7855)
      )', 4326),
    1050
)
ON CONFLICT (vehicle_name) DO UPDATE SET
    route_geometry = EXCLUDED.route_geometry,
    street_names   = EXCLUDED.street_names,
    households     = EXCLUDED.households,
    workers        = EXCLUDED.workers;

-- PC-3: Ward 5
INSERT INTO garbage_routes (vehicle_name, ward_number, street_names, households, workers, route_geometry, total_length_meters)
VALUES (
    'PC-3', '5',
    ARRAY['Gandhi Nagar Main Road', 'Anna Street', 'Nehru Street'],
    132, 2,
    ST_GeomFromText(
      'MULTILINESTRING(
        (77.8350 10.7920, 77.8360 10.7935, 77.8370 10.7950, 77.8380 10.7965, 77.8390 10.7980),
        (77.8390 10.7980, 77.8395 10.7960, 77.8400 10.7940),
        (77.8400 10.7940, 77.8380 10.7940, 77.8360 10.7940)
      )', 4326),
    760
)
ON CONFLICT (vehicle_name) DO UPDATE SET
    route_geometry = EXCLUDED.route_geometry,
    street_names   = EXCLUDED.street_names,
    households     = EXCLUDED.households,
    workers        = EXCLUDED.workers;

-- BOV-1: Ward 4 — Battery vehicle, larger area
INSERT INTO garbage_routes (vehicle_name, ward_number, street_names, households, workers, route_geometry, total_length_meters)
VALUES (
    'BOV-1', '4',
    ARRAY['Market Street', 'Anna Salai', 'South Car Street', 'Hospital Road'],
    320, 4,
    ST_GeomFromText(
      'MULTILINESTRING(
        (77.8200 10.7800, 77.8215 10.7815, 77.8230 10.7830, 77.8245 10.7845, 77.8260 10.7860),
        (77.8260 10.7860, 77.8260 10.7875, 77.8260 10.7890, 77.8260 10.7905, 77.8260 10.7920),
        (77.8260 10.7920, 77.8240 10.7920, 77.8220 10.7920, 77.8200 10.7920),
        (77.8200 10.7920, 77.8200 10.7900, 77.8200 10.7880, 77.8200 10.7860, 77.8200 10.7840, 77.8200 10.7820)
      )', 4326),
    1680
)
ON CONFLICT (vehicle_name) DO UPDATE SET
    route_geometry = EXCLUDED.route_geometry,
    street_names   = EXCLUDED.street_names,
    households     = EXCLUDED.households,
    workers        = EXCLUDED.workers;

-- BOV-2: Ward 5
INSERT INTO garbage_routes (vehicle_name, ward_number, street_names, households, workers, route_geometry, total_length_meters)
VALUES (
    'BOV-2', '5',
    ARRAY['Raja Street', 'Kovil Street', 'Bus Stand Road', 'New Colony Main Road'],
    280, 4,
    ST_GeomFromText(
      'MULTILINESTRING(
        (77.8420 10.7850, 77.8435 10.7865, 77.8450 10.7880, 77.8465 10.7895),
        (77.8465 10.7895, 77.8465 10.7875, 77.8465 10.7855, 77.8465 10.7835),
        (77.8465 10.7835, 77.8445 10.7835, 77.8425 10.7835),
        (77.8425 10.7835, 77.8425 10.7855, 77.8425 10.7875, 77.8425 10.7895)
      )', 4326),
    1520
)
ON CONFLICT (vehicle_name) DO UPDATE SET
    route_geometry = EXCLUDED.route_geometry,
    street_names   = EXCLUDED.street_names,
    households     = EXCLUDED.households,
    workers        = EXCLUDED.workers;

-- AC-1: Ward 6 — Auto compactor, main roads
INSERT INTO garbage_routes (vehicle_name, ward_number, street_names, households, workers, route_geometry, total_length_meters)
VALUES (
    'AC-1', '6',
    ARRAY['Main Bazaar', 'Town Hall Road', 'Collector Office Road', 'Court Road'],
    510, 5,
    ST_GeomFromText(
      'MULTILINESTRING(
        (77.8150 10.7750, 77.8175 10.7765, 77.8200 10.7780, 77.8225 10.7795, 77.8250 10.7810),
        (77.8250 10.7810, 77.8265 10.7810, 77.8280 10.7810, 77.8295 10.7810, 77.8310 10.7810),
        (77.8310 10.7810, 77.8310 10.7790, 77.8310 10.7770, 77.8310 10.7750),
        (77.8310 10.7750, 77.8280 10.7750, 77.8250 10.7750, 77.8220 10.7750, 77.8190 10.7750)
      )', 4326),
    2200
)
ON CONFLICT (vehicle_name) DO UPDATE SET
    route_geometry = EXCLUDED.route_geometry,
    street_names   = EXCLUDED.street_names,
    households     = EXCLUDED.households,
    workers        = EXCLUDED.workers;

-- AC-2: Ward 7
INSERT INTO garbage_routes (vehicle_name, ward_number, street_names, households, workers, route_geometry, total_length_meters)
VALUES (
    'AC-2', '7',
    ARRAY['Industrial Area Road', 'Factory Street', 'River View Road'],
    390, 5,
    ST_GeomFromText(
      'MULTILINESTRING(
        (77.8500 10.7720, 77.8520 10.7735, 77.8540 10.7750, 77.8560 10.7765, 77.8580 10.7780),
        (77.8580 10.7780, 77.8580 10.7760, 77.8580 10.7740, 77.8580 10.7720),
        (77.8580 10.7720, 77.8555 10.7720, 77.8530 10.7720, 77.8505 10.7720)
      )', 4326),
    1950
)
ON CONFLICT (vehicle_name) DO UPDATE SET
    route_geometry = EXCLUDED.route_geometry,
    street_names   = EXCLUDED.street_names,
    households     = EXCLUDED.households,
    workers        = EXCLUDED.workers;

-- TC-1: Ward 8 — Tractor, outskirt roads
INSERT INTO garbage_routes (vehicle_name, ward_number, street_names, households, workers, route_geometry, total_length_meters)
VALUES (
    'TC-1', '8',
    ARRAY['Bypass Road', 'Panchayat Union Road', 'Village Link Road'],
    220, 4,
    ST_GeomFromText(
      'MULTILINESTRING(
        (77.8600 10.7800, 77.8625 10.7815, 77.8650 10.7830, 77.8675 10.7845, 77.8700 10.7860),
        (77.8700 10.7860, 77.8700 10.7840, 77.8700 10.7820, 77.8700 10.7800),
        (77.8700 10.7800, 77.8670 10.7800, 77.8640 10.7800, 77.8610 10.7800)
      )', 4326),
    2450
)
ON CONFLICT (vehicle_name) DO UPDATE SET
    route_geometry = EXCLUDED.route_geometry,
    street_names   = EXCLUDED.street_names,
    households     = EXCLUDED.households,
    workers        = EXCLUDED.workers;
