-- ClimaShield TN Database Schema & Migration Script

-- 1. Create Enums if not exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CITIZEN', 'DISTRICT_OFFICER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('PENDING_REVIEW', 'VERIFIED_ACTIVE', 'RESOLVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'CITIZEN',
    home_district VARCHAR(100) DEFAULT 'Chennai',
    home_lat NUMERIC(8, 4) DEFAULT 13.0827,
    home_lon NUMERIC(8, 4) DEFAULT 80.2707,
    auth_provider VARCHAR(50) DEFAULT 'LOCAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enhanced Citizen Reports Table
CREATE TABLE IF NOT EXISTS citizen_reports (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    district VARCHAR(100) NOT NULL DEFAULT 'Chennai',
    hazard_type VARCHAR(100) NOT NULL DEFAULT 'Flood',
    description TEXT NOT NULL,
    image_url TEXT,
    reported_lat NUMERIC(8, 4) DEFAULT 13.0827,
    reported_lon NUMERIC(8, 4) DEFAULT 80.2707,
    lat NUMERIC(8, 4) DEFAULT 13.0827,
    lon NUMERIC(8, 4) DEFAULT 80.2707,
    status report_status DEFAULT 'PENDING_REVIEW',
    verified_by INT REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geom GEOMETRY(Point, 4326)
);

-- Alter table if citizen_reports existed from previous migrations
ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS status report_status DEFAULT 'PENDING_REVIEW';
ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS verified_by INT REFERENCES users(id);
ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS reported_lat NUMERIC(8, 4) DEFAULT 13.0827;
ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS reported_lon NUMERIC(8, 4) DEFAULT 80.2707;
ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS geom GEOMETRY(Point, 4326);

ALTER TABLE citizen_reports ALTER COLUMN lat DROP NOT NULL;
ALTER TABLE citizen_reports ALTER COLUMN lon DROP NOT NULL;
UPDATE citizen_reports SET lat = COALESCE(lat, reported_lat, 13.0827), lon = COALESCE(lon, reported_lon, 80.2707) WHERE lat IS NULL OR lon IS NULL;

-- Function and trigger to auto-update PostGIS geometry point
CREATE OR REPLACE FUNCTION update_report_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        BEGIN
            NEW.geom = ST_SetSRID(ST_MakePoint(COALESCE(NEW.reported_lon, NEW.lon, 80.2707), COALESCE(NEW.reported_lat, NEW.lat, 13.0827)), 4326);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reports_geom ON citizen_reports;
CREATE TRIGGER trg_reports_geom
BEFORE INSERT OR UPDATE ON citizen_reports
FOR EACH ROW EXECUTE FUNCTION update_report_geom();

-- 5. User Activity Logs Table
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    target_entity VARCHAR(150) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
