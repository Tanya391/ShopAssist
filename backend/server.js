import 'dotenv/config';
import express from 'express';
import path from 'path';
import { processSupportWorkflow } from './lib/workflowEngine.js';
import { prisma } from './lib/prisma.js';
import { indexKnowledgeBaseToPinecone, indexSingleDocumentToPinecone } from './lib/retriever.js';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { authenticateToken, requireAdmin, generateToken } from './lib/auth.js';
import bcrypt from 'bcryptjs';

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
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));

  const chatRateLimiter = rateLimit({
    windowMs: parseInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.CHAT_RATE_LIMIT_MAX_REQUESTS || '10', 10),
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Index Markdown Knowledge Base into Pinecone Vector Store on Startup
  try {
    // const chunkCount = await indexKnowledgeBaseToPinecone();
    // addLog(
    //   'INFO',
    //   'PineconeIndexer',
    //   `Successfully indexed ${chunkCount} markdown chunks into Pinecone vector store.`
    // );
  } catch (err) {
    console.warn('Pinecone initialization error:', err);
    addLog(
      'WARN',
      'PineconeIndexer',
      `Pinecone indexer initialized in fallback mode: ${err.message}`
    );
  }

  
  // Auth APIs
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) return res.status(400).json({ error: 'Name, email and password required' });
      
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: 'User already exists' });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name }
      });
      
      const token = generateToken(user);
      res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Signup failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      
      const token = generateToken(user);
      res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

// Health check
  app.get('/api/health', async (req, res) => {
    try {
      res.json({
        status: 'ok',
        service: 'ShopAssist AI'
      });
    } catch (err) {
      console.error('[HealthCheck] Error:', err.message);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  });

  // Chat endpoint
  app.post('/api/chat', chatRateLimiter, authenticateToken, async (req, res) => {
    try {
      const { query, history = [], sessionContext } = req.body;

      const maxQueryLength = parseInt(process.env.MAX_QUERY_LENGTH || '4000', 10);
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Query parameter cannot be empty.' });
      }
      if (query.length > maxQueryLength) {
        return res.status(400).json({ error: 'Query exceeds maximum allowed length.' });
      }

      addLog('INFO', 'ChatRequest', `Received query: "${query.slice(0, 40)}..."`);

      const result = await processSupportWorkflow(query, history, sessionContext);

      addLog('WORKFLOW', 'WorkflowTrace', `Processed query under intent ${result.intent}`, {
        intent: result.intent,
        retrievedChunksCount: result.retrievedChunks.length,
        ticketCreated: Boolean(result.createdTicket),
        orderFound: Boolean(result.orderData)
      });

      res.json(result);
    } catch (err) {
      console.error('Error handling /api/chat:', err.message);
      addLog('ERROR', 'ChatEndpoint', `Error processing chat query: ${err.message}`);
      res.status(500).json({
        error: 'An error occurred while processing your request.'
      });
    }
  });

  // Knowledge Base APIs
  app.get('/api/knowledge', requireAdmin, async (req, res) => {
    try {
      const docs = await prisma.knowledgeDoc.findMany();
      res.json(docs);
    } catch (err) {
      console.error('[Knowledge API] Error:', err.message);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  });

  app.put('/api/knowledge/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { content, title } = req.body;

      const updated = await prisma.knowledgeDoc.update({
        where: { id },
        data: { title, content }
      });

      // Index only the updated document into Pinecone
      await indexSingleDocumentToPinecone(updated.fileName, updated.title, updated.content);

      addLog(
        'INFO',
        'KnowledgeBase',
        `Updated document ${updated.fileName} in Prisma and selectively re-indexed Pinecone`
      );
      res.json(updated);
    } catch (err) {
      console.error('[Knowledge API] Error:', err.message);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  });

  app.post('/api/knowledge/reindex', requireAdmin, async (req, res) => {
    try {
      const chunkCount = await indexKnowledgeBaseToPinecone();
      addLog(
        'INFO',
        'PineconeIndexer',
        `Manual full re-index complete: indexed ${chunkCount} new/updated chunks into Pinecone.`
      );
      res.json({ success: true, message: `Re-indexed ${chunkCount} chunks. Unchanged documents were skipped.` });
    } catch (err) {
      console.error('[Knowledge API] Error:', err.message);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  });

  // Orders API
  app.get('/api/orders', requireAdmin, async (req, res) => {
    try {
      const orders = await prisma.order.findMany();
      res.json(orders.map(o => ({ ...o, items: JSON.parse(o.itemsJson || '[]') })));
    } catch (err) {
      console.error('[Orders API] Error:', err.message);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  });

  app.get('/api/orders/:id', requireAdmin, async (req, res) => {
    try {
      const orderId = req.params.id.toUpperCase();
      const order = await prisma.order.findUnique({ where: { orderId } });
      if (!order) {
        return res.status(404).json({ error: `Order ${orderId} not found.` });
      }
      res.json({ ...order, items: JSON.parse(order.itemsJson || '[]') });
    } catch (err) {
      console.error('[Orders API] Error:', err.message);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  });

  // Tickets API
  app.get('/api/tickets', requireAdmin, async (req, res) => {
    try {
      const tickets = await prisma.supportTicket.findMany();
      res.json(tickets);
    } catch (err) {
      console.error('[Tickets API] Error:', err.message);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  });

  app.post('/api/tickets', requireAdmin, async (req, res) => {
    try {
      const { customerName, orderId, category, description, priority, email } = req.body;
      if (!customerName || !description) {
        return res
          .status(400)
          .json({ error: 'Customer Name and Description are required.' });
      }

      const fullUuid = crypto.randomUUID();
      const tNum = `TICK-${fullUuid.toUpperCase()}`;
      const newTicket = await prisma.supportTicket.create({
        data: {
          id: fullUuid,
          ticketNumber: tNum,
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
      console.error('[Tickets API] Error:', err.message);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  });

  app.patch('/api/tickets/:id', requireAdmin, async (req, res) => {
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
      console.error('[Tickets API] Error:', err.message);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  });

  // System Logs
  app.get('/api/logs', requireAdmin, (req, res) => {
    res.json(systemLogs);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ShopAssist AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
