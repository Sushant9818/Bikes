import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data in order to avoid conflicts
  console.log("🗑️  Clearing existing data...");
  await prisma.appointmentService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.stockHistory.deleteMany({});
  await prisma.part.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.testDriveRequest.deleteMany({});
  await prisma.contactRequest.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Data cleared successfully");

  // Create SUPER_ADMIN user
  console.log("👤 Creating SUPER_ADMIN user...");
  const superAdmin = await prisma.user.create({
    data: {
      clerkUserId: "clerk_super_admin_001",
      username: "superadmin",
      fullName: "Super Administrator",
      email: "admin@suzukibike.com",
      phoneNumber: "+91-9876543210",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      avatar: null,
    },
  });
  console.log("✅ SUPER_ADMIN user created:", superAdmin);

  // Create 3 vehicles
  console.log("🏍️  Creating vehicles...");
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        type: "BIKE",
        modelName: "Suzuki GSX-R750",
        slug: "suzuki-gsx-r750",
        category: "Sportbike",
        brand: "Suzuki",
        price: 850000,
        discountPrice: 799999,
        year: 2024,
        quantity: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
        images: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
        ],
        description: "High-performance sportbike with advanced electronics",
        specs: {
          engine: "749cc Parallel Twin",
          maxPower: "110 hp",
          maxTorque: "86 Nm",
          fuelCapacity: "20 liters",
        },
        colors: ["Red", "Black", "Blue"],
        status: "ACTIVE",
        isFeatured: true,
        isNewArrival: true,
        seoTitle: "Suzuki GSX-R750 - High-Performance Sportbike",
        seoDescription: "Experience ultimate riding with Suzuki GSX-R750",
      },
    }),
    prisma.vehicle.create({
      data: {
        type: "SCOOTER",
        modelName: "Suzuki Address 125",
        slug: "suzuki-address-125",
        category: "Scooter",
        brand: "Suzuki",
        price: 120000,
        discountPrice: 110000,
        year: 2024,
        quantity: 15,
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
        images: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
        ],
        description: "Efficient and stylish scooter for daily commuting",
        specs: {
          engine: "125cc Single Cylinder",
          maxPower: "8.5 hp",
          maxTorque: "10.2 Nm",
          fuelCapacity: "5.5 liters",
        },
        colors: ["Silver", "Black", "Pearl White"],
        status: "ACTIVE",
        isFeatured: false,
        isNewArrival: false,
        seoTitle: "Suzuki Address 125 - Efficient Scooter",
        seoDescription: "Commute in style with Suzuki Address 125",
      },
    }),
    prisma.vehicle.create({
      data: {
        type: "BIKE",
        modelName: "Suzuki Gixxer 250",
        slug: "suzuki-gixxer-250",
        category: "Street Bike",
        brand: "Suzuki",
        price: 250000,
        discountPrice: 235000,
        year: 2024,
        quantity: 8,
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
        images: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
        ],
        description: "Aggressive street bike with modern styling",
        specs: {
          engine: "249cc Single Cylinder",
          maxPower: "26.5 hp",
          maxTorque: "22.2 Nm",
          fuelCapacity: "12 liters",
        },
        colors: ["Red", "Black", "Silver"],
        status: "ACTIVE",
        isFeatured: true,
        isNewArrival: true,
        seoTitle: "Suzuki Gixxer 250 - Street Bike Performance",
        seoDescription: "Ride with aggression and style - Suzuki Gixxer 250",
      },
    }),
  ]);
  console.log("✅ Vehicles created successfully:", vehicles.length);

  // Create 3 parts
  console.log("🔧 Creating parts...");
  const parts = await Promise.all([
    prisma.part.create({
      data: {
        type: "BIKE_PART",
        partName: "Premium Brake Pads Set",
        sku: "BRAKE-PAD-001",
        compatibleModel: "Multiple Models",
        brand: "Suzuki",
        price: 2500,
        quantity: 50,
        minStock: 10,
        imageUrl:
          "https://images.unsplash.com/photo-1487754180144-351b8e3fedc9?w=500",
      },
    }),
    prisma.part.create({
      data: {
        type: "BIKE_PART",
        partName: "Air Filter Standard",
        sku: "AIR-FILTER-002",
        compatibleModel: "Multiple Models",
        brand: "Suzuki",
        price: 800,
        quantity: 100,
        minStock: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1487754180144-351b8e3fedc9?w=500",
      },
    }),
    prisma.part.create({
      data: {
        type: "SCOOTER_PART",
        partName: "Spark Plug Premium",
        sku: "SPARK-PLUG-003",
        compatibleModel: "Address Series",
        brand: "Suzuki",
        price: 400,
        quantity: 200,
        minStock: 50,
        imageUrl:
          "https://images.unsplash.com/photo-1487754180144-351b8e3fedc9?w=500",
      },
    }),
  ]);
  console.log("✅ Parts created successfully:", parts.length);

  console.log("✨ Database seeding completed successfully!");
  console.log(`
Summary:
- SUPER_ADMIN users: 1
- Vehicles created: ${vehicles.length}
- Parts created: ${parts.length}
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
