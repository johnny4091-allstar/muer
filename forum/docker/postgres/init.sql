-- Enable PostgreSQL extensions for StreamZone
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- GIN indexes for full-text search (created after Prisma migration runs)
-- These are created via migration instead
