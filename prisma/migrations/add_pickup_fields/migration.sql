-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'READY_FOR_PICKUP';
ALTER TYPE "OrderStatus" ADD VALUE 'PICKED_UP';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "pickup_location" TEXT,
ADD COLUMN "estimated_pickup_time" TIMESTAMP(3),
ADD COLUMN "pickup_code" TEXT,
ADD COLUMN "actual_pickup_time" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "orders_pickup_code_key" ON "orders"("pickup_code");
