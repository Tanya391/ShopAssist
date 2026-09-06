import { PrismaClient } from '@prisma/client';
import { MOCK_ORDERS } from '../data/mockOrders.js';
import { INITIAL_TICKETS } from '../data/mockTickets.js';
import { DEFAULT_KNOWLEDGE_DOCS } from '../data/defaultKnowledge.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Seed Orders
  for (const [key, orderData] of Object.entries(MOCK_ORDERS)) {
    const order = await prisma.order.upsert({
      where: { orderId: orderData.orderId },
      update: {},
      create: {
        orderId: orderData.orderId,
        customerName: orderData.customerName,
        status: orderData.status,
        carrier: orderData.carrier,
        trackingNumber: orderData.trackingNumber,
        estimatedDelivery: orderData.estimatedDelivery,
        deliveredDate: orderData.deliveredDate,
        totalAmount: orderData.totalAmount,
        returnEligible: orderData.returnEligible,
        itemsJson: JSON.stringify(orderData.items)
      }
    });
    console.log(`Upserted Order: ${order.orderId}`);
  }

  // 2. Seed Tickets (from mockTickets.js)
  for (const ticket of INITIAL_TICKETS) {
    const t = await prisma.supportTicket.upsert({
      where: { id: ticket.id },
      update: {},
      create: {
        id: ticket.id,
        ticketNumber: ticket.id,
        customerName: ticket.customerName,
        email: ticket.email,
        orderId: ticket.orderId,
        category: ticket.category,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: new Date(ticket.createdAt),
        resolutionNotes: ticket.resolutionNotes
      }
    });
    console.log(`Upserted Ticket: ${t.id}`);
  }

  // 3. Add the hardcoded tickets that were previously in prisma.js
  const extraTickets = [
    {
      id: 'TICK-1001',
      ticketNumber: 'TICK-1001',
      customerName: 'Sarah Connor',
      email: 'sarah.connor@example.com',
      orderId: 'ORD-1002',
      category: 'Damaged Product',
      description: 'Received keyboard with keycap broken during shipment.',
      priority: 'High',
      status: 'Open',
      createdAt: new Date()
    },
    {
      id: 'TICK-1002',
      ticketNumber: 'TICK-1002',
      customerName: 'Marcus Wright',
      email: 'marcus.w@example.com',
      orderId: 'ORD-1003',
      category: 'Late Delivery',
      description: 'Shipment delayed by carrier beyond 5 business days.',
      priority: 'Medium',
      status: 'In Review',
      createdAt: new Date()
    }
  ];

  for (const ticket of extraTickets) {
    const t = await prisma.supportTicket.upsert({
      where: { id: ticket.id },
      update: {},
      create: {
        id: ticket.id,
        ticketNumber: ticket.id,
        customerName: ticket.customerName,
        email: ticket.email,
        orderId: ticket.orderId,
        category: ticket.category,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });
    console.log(`Upserted Ticket: ${t.id}`);
  }

  // 4. Seed KnowledgeDocs
  for (const doc of DEFAULT_KNOWLEDGE_DOCS) {
    const d = await prisma.knowledgeDoc.upsert({
      where: { id: doc.id },
      update: {},
      create: {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        content: doc.content
      }
    });
    console.log(`Upserted KnowledgeDoc: ${d.id}`);
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
