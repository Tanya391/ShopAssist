import { PrismaClient } from '@prisma/client';
import { MOCK_ORDERS } from '../data/mockOrders.js';
import { DEFAULT_KNOWLEDGE_DOCS } from '../data/defaultKnowledge.js';

// Global Prisma singleton instance
const globalForPrisma = globalThis;

export const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')
);

let rawPrisma = null;

if (hasDatabaseUrl) {
  try {
    rawPrisma = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = rawPrisma;
    }
  } catch (err) {
    console.warn(
      '[Prisma] Could not initialize Prisma Client with provided DATABASE_URL, falling back to mock layer:',
      err
    );
  }
}

// ---------------------------------------------------------------------------
// NOTE: defaultKnowledge.js is a temporary legacy fallback data source.
// It will be consolidated in the database/RAG phase when Supabase is connected
// and Prisma migrations have been established.
// ---------------------------------------------------------------------------

// In-memory fallback database stores (seeded with initial data)
let inMemoryTickets = [
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
    createdAt: new Date().toISOString()
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
    createdAt: new Date().toISOString()
  }
];

let inMemoryOrders = { ...MOCK_ORDERS };
let inMemoryKnowledgeDocs = [...DEFAULT_KNOWLEDGE_DOCS];

// Exported Unified Database Wrapper using Prisma ORM with safe in-memory fallback
export const prisma = {
  supportTicket: {
    findMany: async (args) => {
      if (rawPrisma) {
        try {
          const tickets = await rawPrisma.supportTicket.findMany({
            orderBy: { createdAt: 'desc' },
            ...args
          });
          return tickets.map(t => ({
            id: t.id,
            ticketNumber: t.ticketNumber || t.id,
            customerName: t.customerName,
            email: t.email,
            orderId: t.orderId,
            category: t.category || 'General Inquiry',
            description: t.description,
            priority: t.priority || 'Medium',
            status: t.status || 'Open',
            createdAt: t.createdAt.toISOString(),
            resolutionNotes: t.resolutionNotes || undefined
          }));
        } catch (e) {
          console.error('[Prisma] Error executing findMany supportTicket:', e);
        }
      }
      return inMemoryTickets;
    },

    findUnique: async ({ where }) => {
      if (rawPrisma) {
        try {
          const t = await rawPrisma.supportTicket.findFirst({
            where: {
              OR: [
                where.id ? { id: where.id } : {},
                where.ticketNumber ? { ticketNumber: where.ticketNumber } : {}
              ]
            }
          });
          if (t) {
            return {
              id: t.id,
              ticketNumber: t.ticketNumber || t.id,
              customerName: t.customerName,
              email: t.email,
              orderId: t.orderId,
              category: t.category || 'General Inquiry',
              description: t.description,
              priority: t.priority || 'Medium',
              status: t.status || 'Open',
              createdAt: t.createdAt.toISOString(),
              resolutionNotes: t.resolutionNotes || undefined
            };
          }
        } catch (e) {
          console.error('[Prisma] Error executing findUnique supportTicket:', e);
        }
      }
      return inMemoryTickets.find(
        t => t.id === where.id || t.ticketNumber === where.id
      ) || null;
    },

    create: async ({ data }) => {
      const ticketNumber = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
      if (rawPrisma) {
        try {
          const created = await rawPrisma.supportTicket.create({
            data: {
              ticketNumber,
              customerName: data.customerName,
              email: data.email || 'customer@example.com',
              orderId: data.orderId || 'N/A',
              category: data.category || 'General Inquiry',
              description: data.description,
              priority: data.priority || 'Medium',
              status: data.status || 'Open',
              resolutionNotes: data.resolutionNotes || null
            }
          });
          return {
            id: created.id,
            ticketNumber: created.ticketNumber || created.id,
            customerName: created.customerName,
            email: created.email,
            orderId: created.orderId,
            category: created.category || 'General Inquiry',
            description: created.description,
            priority: created.priority || 'Medium',
            status: created.status || 'Open',
            createdAt: created.createdAt.toISOString(),
            resolutionNotes: created.resolutionNotes || undefined
          };
        } catch (e) {
          console.error('[Prisma] Error executing create supportTicket:', e);
        }
      }
      const newT = {
        id: ticketNumber,
        ticketNumber,
        customerName: data.customerName,
        email: data.email || 'customer@example.com',
        orderId: data.orderId || 'N/A',
        category: data.category || 'General Inquiry',
        description: data.description,
        priority: data.priority || 'Medium',
        status: data.status || 'Open',
        resolutionNotes: data.resolutionNotes || undefined,
        createdAt: new Date().toISOString()
      };
      inMemoryTickets.unshift(newT);
      return newT;
    },

    update: async ({ where, data }) => {
      if (rawPrisma) {
        try {
          const updated = await rawPrisma.supportTicket.update({
            where: { id: where.id },
            data
          });
          return {
            id: updated.id,
            ticketNumber: updated.ticketNumber || updated.id,
            customerName: updated.customerName,
            email: updated.email,
            orderId: updated.orderId,
            category: updated.category || 'General Inquiry',
            description: updated.description,
            priority: updated.priority || 'Medium',
            status: updated.status || 'Open',
            createdAt: updated.createdAt.toISOString(),
            resolutionNotes: updated.resolutionNotes || undefined
          };
        } catch (e) {
          console.error('[Prisma] Error executing update supportTicket:', e);
        }
      }
      const idx = inMemoryTickets.findIndex(
        t => t.id === where.id || t.ticketNumber === where.id
      );
      if (idx !== -1) {
        if (data.status) inMemoryTickets[idx].status = data.status;
        if (data.resolutionNotes) inMemoryTickets[idx].resolutionNotes = data.resolutionNotes;
        if (data.priority) inMemoryTickets[idx].priority = data.priority;
        return inMemoryTickets[idx];
      }
      throw new Error(`Ticket ${where.id} not found`);
    }
  },

  order: {
    findMany: async () => {
      if (rawPrisma) {
        try {
          const rawOrders = await rawPrisma.order.findMany();
          if (rawOrders.length > 0) {
            return rawOrders.map(o => ({
              orderId: o.orderId,
              customerName: o.customerName,
              status: o.status,
              carrier: o.carrier || undefined,
              trackingNumber: o.trackingNumber || undefined,
              estimatedDelivery: o.estimatedDelivery || undefined,
              deliveredDate: o.deliveredDate || undefined,
              totalAmount: o.totalAmount,
              returnEligible: o.returnEligible,
              items: JSON.parse(o.itemsJson || '[]')
            }));
          }
        } catch (e) {
          console.error('[Prisma] Error executing findMany order:', e);
        }
      }
      return Object.values(inMemoryOrders);
    },

    findUnique: async ({ where }) => {
      const formattedId = where.orderId.toUpperCase();
      if (rawPrisma) {
        try {
          const o = await rawPrisma.order.findUnique({
            where: { orderId: formattedId }
          });
          if (o) {
            return {
              orderId: o.orderId,
              customerName: o.customerName,
              status: o.status,
              carrier: o.carrier || undefined,
              trackingNumber: o.trackingNumber || undefined,
              estimatedDelivery: o.estimatedDelivery || undefined,
              deliveredDate: o.deliveredDate || undefined,
              totalAmount: o.totalAmount,
              returnEligible: o.returnEligible,
              items: JSON.parse(o.itemsJson || '[]')
            };
          }
        } catch (e) {
          console.error('[Prisma] Error executing findUnique order:', e);
        }
      }
      return inMemoryOrders[formattedId] || null;
    }
  },

  knowledgeDoc: {
    findMany: async () => {
      if (rawPrisma) {
        try {
          const docs = await rawPrisma.knowledgeDoc.findMany();
          if (docs.length > 0) {
            return docs.map(d => ({
              id: d.id,
              title: d.title,
              fileName: d.fileName,
              category: 'policy',
              content: d.content,
              updatedAt: d.updatedAt.toISOString().split('T')[0]
            }));
          }
        } catch (e) {
          console.error('[Prisma] Error executing findMany knowledgeDoc:', e);
        }
      }
      return inMemoryKnowledgeDocs;
    },

    update: async ({ where, data }) => {
      if (rawPrisma) {
        try {
          const updated = await rawPrisma.knowledgeDoc.update({
            where: { id: where.id },
            data
          });
          return {
            id: updated.id,
            title: updated.title,
            fileName: updated.fileName,
            category: 'policy',
            content: updated.content,
            updatedAt: updated.updatedAt.toISOString().split('T')[0]
          };
        } catch (e) {
          console.error('[Prisma] Error updating knowledgeDoc:', e);
        }
      }
      const idx = inMemoryKnowledgeDocs.findIndex(d => d.id === where.id);
      if (idx !== -1) {
        if (data.title) inMemoryKnowledgeDocs[idx].title = data.title;
        if (data.content) inMemoryKnowledgeDocs[idx].content = data.content;
        inMemoryKnowledgeDocs[idx].updatedAt = new Date().toISOString().split('T')[0];
        return inMemoryKnowledgeDocs[idx];
      }
      throw new Error(`Doc ${where.id} not found`);
    }
  }
};
