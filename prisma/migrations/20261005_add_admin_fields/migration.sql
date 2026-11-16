-- Update Role enum to add SUPER_ADMIN and USER, remove ADMIN and CLIENT mapping
-- Create new type first
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING 
  CASE 
    WHEN "role"::text = 'ADMIN' THEN 'SUPER_ADMIN'::"Role_new"
    WHEN "role"::text = 'CLIENT' THEN 'USER'::"Role_new"
    ELSE 'USER'::"Role_new"
  END;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- Add new columns to users table
ALTER TABLE "users" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "users" ADD COLUMN "avatar" TEXT;
ALTER TABLE "users" ADD COLUMN "last_login" TIMESTAMP(3);

-- Add columns to vehicles table
ALTER TABLE "vehicles" ADD COLUMN "slug" TEXT;
ALTER TABLE "vehicles" ADD COLUMN "category" TEXT;
ALTER TABLE "vehicles" ADD COLUMN "discount_price" DOUBLE PRECISION;
ALTER TABLE "vehicles" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "vehicles" ADD COLUMN "specs" JSONB;
ALTER TABLE "vehicles" ADD COLUMN "colors" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "vehicles" ADD COLUMN "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "vehicles" ADD COLUMN "is_featured" BOOLEAN DEFAULT false;
ALTER TABLE "vehicles" ADD COLUMN "is_new_arrival" BOOLEAN DEFAULT false;
ALTER TABLE "vehicles" ADD COLUMN "seo_title" TEXT;
ALTER TABLE "vehicles" ADD COLUMN "seo_description" TEXT;
ALTER TABLE "vehicles" ADD COLUMN "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "vehicles" ADD COLUMN "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_model_name_key" UNIQUE ("model_name");
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_slug_key" UNIQUE ("slug");

-- Add columns to parts table
ALTER TABLE "parts" ADD COLUMN "sku" TEXT UNIQUE;
ALTER TABLE "parts" ADD COLUMN "min_stock" INTEGER DEFAULT 10;
ALTER TABLE "parts" ADD COLUMN "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "parts" ADD COLUMN "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "parts" ADD COLUMN "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Create stock_history table
CREATE TABLE "stock_history" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER,
    "part_id" INTEGER,
    "quantity_change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_history_pkey" PRIMARY KEY ("id")
);

-- Create activity_logs table
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add user_id FK to appointments for admin audit trail
ALTER TABLE "appointments" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
