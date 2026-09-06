import { prisma } from '../prisma.js';
import { retrieveRelevantChunks } from '../retriever.js';
import crypto from 'crypto';

// Gemini Function Declarations
export const toolsDeclarations = [
  {
    name: 'getOrderById',
    description: 'Retrieve order tracking and status information using an Order ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        orderId: {
          type: 'STRING',
          description: 'The unique order identifier, usually starting with ORD- (e.g. ORD-1002)'
        }
      },
      required: ['orderId']
    }
  },
  {
    name: 'searchKnowledgeBase',
    description: 'Retrieve company policies, product information, refunds, returns, and shipping rules from the knowledge base.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'The search query to look up in the knowledge base.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'createSupportTicket',
    description: 'Create a customer support ticket for complaints or issues requiring human intervention.',
    parameters: {
      type: 'OBJECT',
      properties: {
        orderId: {
          type: 'STRING',
          description: 'The Order ID associated with the complaint, if any.'
        },
        category: {
          type: 'STRING',
          description: 'The category of the complaint (e.g., Damaged Product, Late Delivery, General Inquiry)'
        },
        description: {
          type: 'STRING',
          description: 'A detailed description of the customer issue.'
        }
      },
      required: ['category', 'description']
    }
  }
];

// Executable implementations
export const toolExecutors = {
  getOrderById: async (args, state) => {
    try {
      const foundOrder = await prisma.order.findUnique({
        where: { orderId: args.orderId }
      });
      if (!foundOrder) {
        return { success: true, result: `Order ${args.orderId} not found in database.` };
      }
      const parsedItems = JSON.parse(foundOrder.itemsJson || '[]');
      const resultObj = { 
        orderId: foundOrder.orderId,
        status: foundOrder.status,
        trackingNumber: foundOrder.trackingNumber,
        estimatedDelivery: foundOrder.estimatedDelivery,
        items: parsedItems 
      };
      return { success: true, result: resultObj, stateUpdate: { orderData: resultObj } };
    } catch (err) {
      console.error('[Tool:getOrderById] Error:', err.message);
      return { success: false, error: 'SERVICE_UNAVAILABLE', message: 'Failed to access order database.' };
    }
  },

  searchKnowledgeBase: async (args, state) => {
    try {
      const chunks = await retrieveRelevantChunks(args.query, 3);
      if (chunks.length === 0) {
        return { success: true, result: 'No relevant information found in the knowledge base.' };
      }
      
      const highestScore = chunks[0].similarityScore || 0;
      const stateUpdate = {
        retrievedChunks: chunks,
        isLowConfidence: highestScore < 0.2
      };

      const resultText = chunks.map(c => `[Source: ${c.fileName} (${c.docTitle})]\n${c.text}`).join('\n\n');
      return { success: true, result: resultText, stateUpdate };
    } catch (err) {
      console.error('[Tool:searchKnowledgeBase] Error:', err.message);
      return { success: false, error: 'SERVICE_UNAVAILABLE', message: 'Knowledge base is currently unavailable.' };
    }
  },

  createSupportTicket: async (args, state) => {
    if (state.createdTicket) {
      return { success: false, error: 'DUPLICATE_TICKET_PREVENTION', message: 'A support ticket has already been created for this request. Do not attempt to create another one.' };
    }

    try {
      const fullUuid = crypto.randomUUID();
      const generatedTicketNumber = `TICK-${fullUuid.toUpperCase()}`;
      const customerName = (state.sessionContext && state.sessionContext.customerName) || (state.orderData ? state.orderData.customerName : 'Valued Customer');
      const email = `${(customerName).toLowerCase().replace(/\s+/g, '.')}@example.com`;

      const createdTicket = await prisma.supportTicket.create({
        data: {
          id: fullUuid,
          ticketNumber: generatedTicketNumber,
          customerName,
          email,
          orderId: args.orderId || 'N/A',
          category: args.category,
          description: args.description,
          priority: args.description.toLowerCase().includes('urgent') || args.description.toLowerCase().includes('broken') ? 'High' : 'Medium',
          status: 'Open'
        }
      });

      return { success: true, result: createdTicket, stateUpdate: { createdTicket } };
    } catch (err) {
      console.error('[Tool:createSupportTicket] Error:', err.message);
      return { success: false, error: 'SERVICE_UNAVAILABLE', message: 'Failed to create support ticket due to database error.' };
    }
  }
};
