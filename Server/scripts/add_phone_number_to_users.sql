-- PostgreSQL migration: Add phone_number to users table
-- Run manually if not using Hibernate ddl-auto: update
-- For empty database or fresh deploy:
ALTER TABLE users ADD COLUMN phone_number VARCHAR(15) NOT NULL;
ALTER TABLE users ADD CONSTRAINT uk_users_phone_number UNIQUE (phone_number);

-- For existing database with users, use this two-step migration:
-- Step 1: Add column as nullable
-- ALTER TABLE users ADD COLUMN phone_number VARCHAR(15);
-- Step 2: Backfill with unique placeholders
-- UPDATE users SET phone_number = '98' || LPAD(id::text, 8, '0') WHERE phone_number IS NULL;
-- Step 3: Make NOT NULL
-- ALTER TABLE users ALTER COLUMN phone_number SET NOT NULL;
-- Step 4: Add unique constraint
-- ALTER TABLE users ADD CONSTRAINT uk_users_phone_number UNIQUE (phone_number);
