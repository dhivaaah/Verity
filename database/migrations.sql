-- Database Migrations for Verity: The Living Knowledge Layer (PostgreSQL + PostGIS)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    reliability_score DOUBLE PRECISION NOT NULL DEFAULT 1.0 CHECK (reliability_score >= 0.0 AND reliability_score <= 1.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Places Table (Universal Directory of Physical Locations)
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Cafe, Hospital, Cinema, Mall, Beach, Metro Station, etc.
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_places_geom ON places USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);

-- 3. Live States Table (The Dynamic Layer on top of Places)
CREATE TABLE IF NOT EXISTS live_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    confidence_score DOUBLE PRECISION NOT NULL DEFAULT 100.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 100.0),
    live_tags JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g., {"open": true, "crowded": "moderate", "wifi": "working", "seats": "available"}
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_states_place_id ON live_states(place_id);
CREATE INDEX IF NOT EXISTS idx_live_states_confidence ON live_states(confidence_score);

-- 4. Status Timelines / Audit Logs (Historical Memory of Places)
CREATE TABLE IF NOT EXISTS status_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- e.g., "tag_update", "contradiction"
    recorded_state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_timeline_place ON status_timeline(place_id, created_at DESC);

-- 5. Gamification Table
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    truth_score INTEGER DEFAULT 0,
    verifications_count INTEGER DEFAULT 0,
    rank_title VARCHAR(50) DEFAULT 'Neighborhood Hero'
);

-- Trigger to keep geom synchronized with latitude and longitude on places
CREATE OR REPLACE FUNCTION update_places_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_places_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON places
FOR EACH ROW EXECUTE FUNCTION update_places_geom();
