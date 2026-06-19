-- Add phone_verified column to users table (PostgreSQL)
-- Run manually if not using Hibernate ddl-auto: update
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;
