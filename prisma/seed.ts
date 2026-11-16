import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create customers
  const customer1 = await prisma.user.create({
    data: {
      clerkUserId: 'clerk_user_1',
      username: 'john_doe',
      fullName: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+977-9841234567',
      role: 'USER',
    },
  })

  const customer2 = await prisma.user.create({
    data: {
      clerkUserId: 'clerk_user_2',
      username: 'jane_smith',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      phoneNumber: '+977-9842345678',
      role: 'USER',
    },
  })

  const customer3 = await prisma.user.create({
    data: {
      clerkUserId: 'clerk_user_3',
      username: 'ram_kumar',
      fullName: 'Ram Kumar',
      email: 'ram@example.com',
      phoneNumber: '+977-9843456789',
      role: 'USER',
    },
  })

  // Create offers
  await prisma.offer.create({
    data: {
      title: 'Monsoon Special - 20% Off',
      description: 'Get 20% discount on all parts and accessories during monsoon season',
      discountPercent: 20,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-30'),
      imageUrl: '/images/monsoon-offer.jpg',
    },
  })

  await prisma.offer.create({
    data: {
      title: 'Summer Clearance - 15% Off',
      description: 'Limited time offer on selected bike models',
      discountPercent: 15,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-05-31'),
      imageUrl: '/images/summer-offer.jpg',
    },
  })

  await prisma.offer.create({
    data: {
      title: 'Winter Service Package - Free Service',
      description: 'Get free winter service with bike purchase',
      discountPercent: 10,
      startDate: new Date('2026-12-01'),
      endDate: new Date('2027-02-28'),
      imageUrl: '/images/winter-offer.jpg',
    },
  })

  // Create orders
  await prisma.order.create({
    data: {
      userId: customer1.id,
      customerName: 'John Doe',
      email: 'john@example.com',
      phone: '+977-9841234567',
      address: 'Kathmandu, Nepal',
      totalAmount: 45000,
      status: 'PAID',
      items: {
        create: [
          {
            partId: 1,
            partName: 'Oil Filter',
            quantity: 2,
            price: 15000,
          },
          {
            partId: 2,
            partName: 'Air Filter',
            quantity: 1,
            price: 15000,
          },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      userId: customer2.id,
      customerName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+977-9842345678',
      address: 'Pokhara, Nepal',
      totalAmount: 85000,
      status: 'SHIPPED',
      items: {
        create: [
          {
            partId: 3,
            partName: 'Brake Pads',
            quantity: 1,
            price: 85000,
          },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      userId: customer3.id,
      customerName: 'Ram Kumar',
      email: 'ram@example.com',
      phone: '+977-9843456789',
      address: 'Lalitpur, Nepal',
      totalAmount: 32000,
      status: 'PENDING',
      items: {
        create: [
          {
            partId: 1,
            partName: 'Oil Filter',
            quantity: 1,
            price: 15000,
          },
          {
            partId: 4,
            partName: 'Spark Plug',
            quantity: 1,
            price: 17000,
          },
        ],
      },
    },
  })

  // Create appointments
  await prisma.appointment.create({
    data: {
      clientUsername: 'John Doe',
      bikeModel: 'Suzuki GSX-R150',
      vin: 'SUZUKI123456789',
      bikeYear: 2022,
      preferredDate: new Date('2026-10-28'),
      preferredTime: '10:00 AM',
      customService: 'Regular maintenance and oil change',
      status: 'APPROVED',
      mechanicName: 'Rajesh Sharma',
      estimatedCost: 5000,
    },
  })

  await prisma.appointment.create({
    data: {
      clientUsername: 'Jane Smith',
      bikeModel: 'Suzuki Avenis',
      vin: 'SUZUKI987654321',
      bikeYear: 2023,
      preferredDate: new Date('2026-10-30'),
      preferredTime: '2:00 PM',
      customService: 'Brake pad replacement and wheel alignment',
      status: 'PENDING',
      mechanicName: 'Prakash Singh',
      estimatedCost: 8000,
    },
  })

  await prisma.appointment.create({
    data: {
      clientUsername: 'Ram Kumar',
      bikeModel: 'Suzuki Access 125',
      vin: 'SUZUKI555555555',
      bikeYear: 2021,
      preferredDate: new Date('2026-11-01'),
      preferredTime: '3:30 PM',
      customService: 'Engine repair and carburetor cleaning',
      status: 'IN_PROGRESS',
      mechanicName: 'Rajesh Sharma',
      estimatedCost: 12000,
    },
  })

  console.log('✅ Seed data created successfully')
  console.log('Created 3 customers')
  console.log('Created 3 offers')
  console.log('Created 3 orders with items')
  console.log('Created 3 appointments')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
