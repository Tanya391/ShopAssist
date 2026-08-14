import 'dotenv/config';
import express from 'express';
import path from 'path';
import { processSupportWorkflow } from './lib/workflowEngine.js';
import { prisma } from './lib/prisma.js';
import { indexKnowledgeBaseToPinecone } from './lib/retriever.js';
import cors from 'cors';

// System execution logs
const systemLogs = [
  {
    id: 'log-1',
    timestamp: new Date().toLocaleTimeString(),
    type: 'INFO',
    category: 'System',
    message:
      'ShopAssist AI Server initialized with Supabase PostgreSQL (Prisma ORM) & Pinecone RAG Pipeline.'
  }
];

function addLog(type, category, message, metadata) {
  systemLogs.unshift({
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString(),
    type,
    category,
    message,
    metadata
  });
  if (systemLogs.length > 100) systemLogs.pop();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

  // Index Markdown Knowledge Base into Pinecone Vector Store on Startup
  try {
    const chunkCount = await indexKnowledgeBaseToPinecone();
    addLog(
      'INFO',
      'PineconeIndexer',
      `Successfully indexed ${chunkCount} markdown chunks into Pinecone vector store.`
    );
  } catch (err) {
    console.warn('Pinecone initialization error:', err);
    addLog(
      'WARN',
      'PineconeIndexer',
      `Pinecone indexer initialized in fallback mode: ${err.message}`
    );
  }

  // Health check
  app.get('/api/health', async (req, res) => {
    try {
      const [docs, tickets, orders] = await Promise.all([
        prisma.knowledgeDoc.findMany(),
        prisma.supportTicket.findMany(),
        prisma.order.findMany()
      ]);

      res.json({
        status: 'ok',
        service: 'ShopAssist AI (Prisma + Pinecone)',
        model: 'gemini-2.0-flash',
        hasApiKey: Boolean(process.env.GEMINI_API_KEY),
        database: 'Supabase PostgreSQL via Prisma ORM',
        vectorDatabase: 'Pinecone Vector Store',
        knowledgeDocsCount: docs.length,
        ticketsCount: tickets.length,
        ordersCount: orders.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { query, history = [], sessionContext } = req.body;

      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Query parameter cannot be empty.' });
      }

      addLog('INFO', 'ChatRequest', `Received query: "${query.slice(0, 40)}..."`);

      const currentDocs = await prisma.knowledgeDoc.findMany();
      const result = await processSupportWorkflow(query, history, currentDocs, sessionContext);

      addLog('WORKFLOW', 'WorkflowTrace', `Processed query under intent ${result.intent}`, {
        intent: result.intent,
        retrievedChunksCount: result.retrievedChunks.length,
        ticketCreated: Boolean(result.createdTicket),
        orderFound: Boolean(result.orderData)
      });

      res.json(result);
    } catch (err) {
      console.error('Error handling /api/chat:', err);
      addLog('ERROR', 'ChatEndpoint', `Error processing chat query: ${err.message}`);
      res.status(500).json({
        error: 'An error occurred while processing your request.',
        details: err.message
      });
    }
  });

  // Knowledge Base APIs
  app.get('/api/knowledge', async (req, res) => {
    try {
      const docs = await prisma.knowledgeDoc.findMany();
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/knowledge/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { content, title } = req.body;

      const updated = await prisma.knowledgeDoc.update({
        where: { id },
        data: { title, content }
      });

      // Re-index into Pinecone
      await indexKnowledgeBaseToPinecone();

      addLog(
        'INFO',
        'KnowledgeBase',
        `Updated document ${updated.fileName} in Prisma and re-indexed Pinecone`
      );
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Orders API
  app.get('/api/orders', async (req, res) => {
    try {
      const orders = await prisma.order.findMany();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    try {
      const orderId = req.params.id.toUpperCase();
      const order = await prisma.order.findUnique({ where: { orderId } });
      if (!order) {
        return res.status(404).json({ error: `Order ${orderId} not found.` });
      }
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Tickets API
  app.get('/api/tickets', async (req, res) => {
    try {
      const tickets = await prisma.supportTicket.findMany();
      res.json(tickets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tickets', async (req, res) => {
    try {
      const { customerName, orderId, category, description, priority, email } = req.body;
      if (!customerName || !description) {
        return res
          .status(400)
          .json({ error: 'Customer Name and Description are required.' });
      }

      const newTicket = await prisma.supportTicket.create({
        data: {
          customerName,
          email: email || `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          orderId: orderId || 'N/A',
          category: category || 'General Inquiry',
          description,
          priority: priority || 'Medium',
          status: 'Open'
        }
      });

      addLog(
        'INFO',
        'TicketStore',
        `Created new support ticket ${newTicket.id} in PostgreSQL via Prisma`
      );
      res.status(201).json(newTicket);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/tickets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, resolutionNotes, priority } = req.body;

      const ticket = await prisma.supportTicket.update({
        where: { id },
        data: { status, resolutionNotes, priority }
      });

      addLog(
        'INFO',
        'TicketStore',
        `Updated ticket ${id} status to ${status} in PostgreSQL via Prisma`
      );
      res.json(ticket);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // System Logs
  app.get('/api/logs', (req, res) => {
    res.json(systemLogs);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ShopAssist AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
