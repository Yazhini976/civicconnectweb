-- ================================================================
-- GARBAGE MONITORING MODULE — PostGIS Schema
-- Migration: 002_garbage_monitoring.sql
-- ================================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ================================================================
-- GARBAGE TRUCKS
-- ================================================================
CREATE TABLE IF NOT EXISTS garbage_trucks (
    id                  SERIAL PRIMARY KEY,
    vehicle_name        VARCHAR(50)  NOT NULL UNIQUE,
    vehicle_type        VARCHAR(50)  NOT NULL,
    registration_number VARCHAR(30),
    driver_name         VARCHAR(100),
    driver_phone        VARCHAR(20),
    gps_device_id       VARCHAR(100) UNIQUE,
    ward_number         VARCHAR(10),
    status              VARCHAR(30)  NOT NULL DEFAULT 'inactive',
    -- status: inactive | on_route | slightly_off_route | route_deviation | critical_deviation
    last_latitude       DOUBLE PRECISION,
    last_longitude      DOUBLE PRECISION,
    last_speed          DOUBLE PRECISION DEFAULT 0,
    last_heading        DOUBLE PRECISION DEFAULT 0,
    last_seen           TIMESTAMP WITH TIME ZONE,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- OFFICIAL MUNICIPALITY GIS ROUTES
-- ================================================================
CREATE TABLE IF NOT EXISTS garbage_routes (
    id                  SERIAL PRIMARY KEY,
    vehicle_name        VARCHAR(50)  NOT NULL UNIQUE REFERENCES garbage_trucks(vehicle_name) ON UPDATE CASCADE,
    ward_number         VARCHAR(10),
    street_names        TEXT[],           -- Array of assigned street names
    households          INTEGER DEFAULT 0,
    workers             INTEGER DEFAULT 0,
    route_geometry      GEOMETRY(MultiLineString, 4326) NOT NULL,
    total_length_meters DOUBLE PRECISION, -- pre-computed length
    buffer_meters       DOUBLE PRECISION DEFAULT 30, -- configurable per-route buffer
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index on route geometry (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_garbage_routes_geometry
    ON garbage_routes USING GIST(route_geometry);

CREATE INDEX IF NOT EXISTS idx_garbage_routes_vehicle
    ON garbage_routes(vehicle_name);

-- ================================================================
-- GPS LOGS (time-series)
-- ================================================================
CREATE TABLE IF NOT EXISTS garbage_gps_logs (
    id          BIGSERIAL PRIMARY KEY,
    truck_id    INTEGER NOT NULL REFERENCES garbage_trucks(id) ON DELETE CASCADE,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    speed       DOUBLE PRECISION DEFAULT 0,
    heading     DOUBLE PRECISION DEFAULT 0,
    accuracy    DOUBLE PRECISION DEFAULT 0,
    altitude    DOUBLE PRECISION DEFAULT 0,
    on_route    BOOLEAN,
    distance_from_route DOUBLE PRECISION,  -- meters
    timestamp   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for GPS logs
CREATE INDEX IF NOT EXISTS idx_gps_logs_truck_time
    ON garbage_gps_logs(truck_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_gps_logs_timestamp
    ON garbage_gps_logs(timestamp DESC);

-- ================================================================
-- ROUTE DEVIATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS garbage_deviations (
    id               SERIAL PRIMARY KEY,
    truck_id         INTEGER NOT NULL REFERENCES garbage_trucks(id) ON DELETE CASCADE,
    started_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at         TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,                    -- filled when deviation ends
    max_distance     DOUBLE PRECISION DEFAULT 0, -- max distance from route (meters)
    start_latitude   DOUBLE PRECISION,
    start_longitude  DOUBLE PRECISION,
    last_latitude    DOUBLE PRECISION,
    last_longitude   DOUBLE PRECISION,
    severity         VARCHAR(20) NOT NULL DEFAULT 'low',
    -- severity: low | medium | high
    status           VARCHAR(20) NOT NULL DEFAULT 'active',
    -- status: active | resolved | acknowledged
    remarks          TEXT,
    alert_sent       BOOLEAN DEFAULT false,
    notified_at      TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deviations_truck_time
    ON garbage_deviations(truck_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_deviations_status
    ON garbage_deviations(status);

CREATE INDEX IF NOT EXISTS idx_deviations_severity
    ON garbage_deviations(severity);

-- Partial index for active deviations (hot query path)
CREATE INDEX IF NOT EXISTS idx_deviations_active
    ON garbage_deviations(truck_id, started_at)
    WHERE status = 'active';

-- ================================================================
-- DEVIATION LOG (low-severity, brief off-route events)
-- ================================================================
CREATE TABLE IF NOT EXISTS garbage_deviation_logs (
    id          BIGSERIAL PRIMARY KEY,
    truck_id    INTEGER NOT NULL REFERENCES garbage_trucks(id) ON DELETE CASCADE,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    distance    DOUBLE PRECISION NOT NULL,
    duration_seconds INTEGER NOT NULL,
    reason      VARCHAR(100) DEFAULT 'brief_detour',
    logged_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deviation_logs_truck
    ON garbage_deviation_logs(truck_id, logged_at DESC);

-- ================================================================
-- TRIGGER: auto-update updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_garbage_trucks_updated
    BEFORE UPDATE ON garbage_trucks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_garbage_routes_updated
    BEFORE UPDATE ON garbage_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_garbage_deviations_updated
    BEFORE UPDATE ON garbage_deviations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
