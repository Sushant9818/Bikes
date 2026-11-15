-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'SHIPPED_BACK', 'RECEIVED', 'REFUNDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "returns" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "order_id" INTEGER NOT NULL,
  "user_id" INTEGER,
  "reason" TEXT NOT NULL,
  "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
  "return_amount" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "refund_date" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE,
  CONSTRAINT "returns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
);

-- CreateTable
CREATE TABLE "return_items" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "return_id" INTEGER NOT NULL,
  "order_item_id" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns" ("id") ON DELETE CASCADE,
  CONSTRAINT "return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items" ("id") ON DELETE CASCADE
);

CREATE INDEX "returns_order_id_idx" ON "returns"("order_id");
CREATE INDEX "returns_user_id_idx" ON "returns"("user_id");
CREATE INDEX "returns_status_idx" ON "returns"("status");
CREATE INDEX "return_items_return_id_idx" ON "return_items"("return_id");
