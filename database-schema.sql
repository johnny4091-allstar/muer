-- IPTV Management Panel Database Schema
-- This schema supports XUI/Xtream UI-like functionality

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends existing auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user', -- 'admin', 'reseller', 'user'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'expired'
  max_connections INTEGER DEFAULT 1,
  is_trial BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_login TIMESTAMP,
  notes TEXT
);

-- Subscription packages
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL, -- subscription duration
  max_connections INTEGER DEFAULT 1,
  price DECIMAL(10, 2),
  features JSONB, -- array of features
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Live TV categories
CREATE TABLE IF NOT EXISTS live_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Live TV streams/channels
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES live_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  stream_url TEXT NOT NULL, -- M3U8, RTMP, etc.
  stream_type VARCHAR(50) DEFAULT 'live', -- 'live', 'radio'
  icon_url TEXT,
  epg_channel_id VARCHAR(255), -- for EPG mapping
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- VOD (Video on Demand) categories
CREATE TABLE IF NOT EXISTS vod_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- VOD content (movies, documentaries, etc.)
CREATE TABLE IF NOT EXISTS vod_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES vod_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  stream_url TEXT NOT NULL,
  poster_url TEXT,
  backdrop_url TEXT,
  year INTEGER,
  rating DECIMAL(3, 1), -- e.g., 8.5
  duration_minutes INTEGER,
  genres JSONB, -- array of genre strings
  director VARCHAR(255),
  cast JSONB, -- array of actor names
  trailer_url TEXT,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Series categories
CREATE TABLE IF NOT EXISTS series_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TV Series
CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES series_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  year INTEGER,
  rating DECIMAL(3, 1),
  genres JSONB,
  cast JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Series seasons
CREATE TABLE IF NOT EXISTS series_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  name VARCHAR(255),
  overview TEXT,
  poster_url TEXT,
  air_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Series episodes
CREATE TABLE IF NOT EXISTS series_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES series_seasons(id) ON DELETE CASCADE,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  overview TEXT,
  stream_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  air_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- 'live', 'vod', 'series'
  content_id UUID NOT NULL, -- references live_streams, vod_content, or series
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- Watch history
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- 'live', 'vod', 'episode'
  content_id UUID NOT NULL,
  progress_seconds INTEGER DEFAULT 0,
  last_watched TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- EPG (Electronic Program Guide) data
CREATE TABLE IF NOT EXISTS epg_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id VARCHAR(255) NOT NULL, -- matches live_streams.epg_channel_id
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  category VARCHAR(100),
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_streams_category ON live_streams(category_id);
CREATE INDEX IF NOT EXISTS idx_vod_content_category ON vod_content(category_id);
CREATE INDEX IF NOT EXISTS idx_series_category ON series(category_id);
CREATE INDEX IF NOT EXISTS idx_series_episodes_season ON series_episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_series_episodes_series ON series_episodes(series_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_epg_channel_time ON epg_programs(channel_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Insert default admin user (password: admin123 - CHANGE THIS!)
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@iptv.local', '$2a$10$rXBzqZqQqZqQqZqQqZqQqOuZqQqZqQqZqQqZqQqZqQqZqQqZqQqZq', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample categories
INSERT INTO live_categories (name, sort_order) VALUES
  ('Entertainment', 1),
  ('Sports', 2),
  ('News', 3),
  ('Movies', 4),
  ('Kids', 5)
ON CONFLICT DO NOTHING;

INSERT INTO vod_categories (name, sort_order) VALUES
  ('Action', 1),
  ('Comedy', 2),
  ('Drama', 3),
  ('Horror', 4),
  ('Sci-Fi', 5),
  ('Documentary', 6)
ON CONFLICT DO NOTHING;

INSERT INTO series_categories (name, sort_order) VALUES
  ('Drama', 1),
  ('Comedy', 2),
  ('Action', 3),
  ('Thriller', 4),
  ('Sci-Fi', 5)
ON CONFLICT DO NOTHING;

-- Insert sample package
INSERT INTO packages (name, description, duration_days, max_connections, price, features) VALUES
  ('Basic', 'Basic IPTV package with 1 connection', 30, 1, 9.99, '["Live TV", "VOD", "Series"]'),
  ('Premium', 'Premium package with 3 connections and all features', 30, 3, 19.99, '["Live TV", "VOD", "Series", "Catch-up TV", "HD Quality"]'),
  ('Ultimate', 'Ultimate package with 5 connections', 30, 5, 29.99, '["Live TV", "VOD", "Series", "Catch-up TV", "4K Quality", "Priority Support"]')
ON CONFLICT DO NOTHING;
