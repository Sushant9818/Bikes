/*
  Warnings:

  - Made the column `sku` on table `parts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `min_stock` on table `parts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `parts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `parts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `parts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `vehicles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_featured` on table `vehicles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_new_arrival` on table `vehicles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `vehicles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `vehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_user_id_fkey";

-- AlterTable
ALTER TABLE "parts" ALTER COLUMN "sku" SET NOT NULL,
ALTER COLUMN "min_stock" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "year" DROP NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "is_featured" SET NOT NULL,
ALTER COLUMN "is_new_arrival" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "part_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_user_id_part_id_key" ON "cart_items"("user_id", "part_id");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
