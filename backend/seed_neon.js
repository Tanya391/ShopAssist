import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function connectDb(retries = 3, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`⏳ Database is waking up... retrying in ${delayMs / 1000} seconds (${i + 1}/${retries - 1})`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

async function main() {
  console.log('Connecting to database (handling potential wake-up delay)...');
  await connectDb();
  console.log('Seeding fresh database with test data...');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@shopassist.com' },
    update: {},
    create: {
      email: 'admin@shopassist.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin'
    },
  });
  console.log('✅ Admin user created: admin@shopassist.com / admin123');

  const order = await prisma.order.upsert({
    where: { orderId: 'ORD-1002' },
    update: {},
    create: {
      orderId: 'ORD-1002',
      customerName: 'Test Customer',
      status: 'Shipped',
      carrier: 'FedEx',
      trackingNumber: 'FX-982134591',
      estimatedDelivery: '2026-08-08',
      totalAmount: 199.99,
      returnEligible: true,
      itemsJson: JSON.stringify([{ name: 'Lumina Smartwatch Series 5', quantity: 1, price: 199.99 }])
    },
  });
  console.log('✅ Test order created: ORD-1002');

  const ticket = await prisma.supportTicket.create({
    data: {
      customerName: 'Test Customer',
      category: 'Returns',
      priority: 'Medium',
      status: 'Open',
      description: 'Customer requested a return for ORD-1002 due to sizing issue.',
      resolutionNotes: ''
    }
  });
  console.log('✅ Test ticket created');
  console.log('🎉 Database seeding complete!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
