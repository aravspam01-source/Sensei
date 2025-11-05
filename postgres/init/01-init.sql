-- Initialize Sensei Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create additional indexes for performance
-- These will be created after the tables are created by Prisma

-- Optimize for large text content
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET effective_cache_size = '256MB';

-- Configure logging
ALTER SYSTEM SET log_min_duration_statement = '1000';
ALTER SYSTEM SET log_checkpoints = 'on';
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';

-- Create backup user if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'backup_user') THEN
        CREATE USER backup_user WITH PASSWORD 'backup_password';
        GRANT CONNECT ON DATABASE sensei_db TO backup_user;
        GRANT USAGE ON SCHEMA public TO backup_user;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
    END IF;
END
$$;