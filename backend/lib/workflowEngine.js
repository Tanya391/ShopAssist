import { GoogleGenAI } from '@google/genai';
import { prisma } from './prisma.js';
import { retrieveRelevantChunks as retrievePineconeChunks } from './retriever.js';

let genAIClient = null;

function getGeminiClient() {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
    }
  }
  return genAIClient;
}

export async function processSupportWorkflow(
  userQuery,
  history,
  knowledgeDocs,
  sessionContext
) {
  const traces = [];
  const toolCalls = [];
  let retrievedChunks = [];
  let orderData = null;
  let createdTicket = null;
  let isLowConfidence = false;

  // Track conversation context
  let extractedOrderId =
    (sessionContext && sessionContext.orderId) || extractOrderIdFromText(userQuery);
  if (!extractedOrderId) {
    for (const msg of [...history].reverse()) {
      const foundInHist = extractOrderIdFromText(msg.text);
      if (foundInHist) {
        extractedOrderId = foundInHist;
        break;
      }
    }
  }

  // NODE 1: Intent Classifier Node
  const node1Start = Date.now();
  let detectedIntent = 'UNKNOWN';
  let complaintCategory = 'General Inquiry';

  const ai = getGeminiClient();

  if (ai) {
    try {
      const classificationPrompt = `You are the Intent Classification Node in ShopAssist AI.
Analyze the user query and recent context.
Query: "${userQuery}"
Context Order ID: "${extractedOrderId || 'None'}"

Classify into exactly ONE of these intents:
- FAQ: General questions about policies (refund, return, shipping, warranty, payment, product details).
- ORDER_QUERY: Asking about status, tracking, or details of a specific order (e.g. ORD-1001).
- COMPLAINT: Expressing issue with a purchase (damaged product, wrong item, missing package, late delivery, defective product).
- OUT_OF_SCOPE: Off-topic questions (jokes, weather, coding, general trivia not related to e-commerce).
- UNKNOWN: Ambiguous input.

Also extract:
- orderId if mentioned (e.g., ORD-1002).
- complaintCategory if complaint ("Damaged Product", "Wrong Product", "Missing Package", "Late Delivery", "Defective Product", "General Inquiry").`;

      const classRes = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: classificationPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              intent: { type: 'STRING' },
              extractedOrderId: { type: 'STRING' },
              complaintCategory: { type: 'STRING' }
            },
            required: ['intent']
          }
        }
      });

      const parsed = JSON.parse(classRes.text || '{}');
      if (
        parsed.intent &&
        ['FAQ', 'ORDER_QUERY', 'COMPLAINT', 'OUT_OF_SCOPE', 'UNKNOWN'].includes(parsed.intent)
      ) {
        detectedIntent = parsed.intent;
      }
      if (parsed.extractedOrderId && parsed.extractedOrderId.toUpperCase().startsWith('ORD-')) {
        extractedOrderId = parsed.extractedOrderId.toUpperCase();
      }
      if (parsed.complaintCategory) {
        complaintCategory = parsed.complaintCategory;
      }
    } catch (err) {
      console.warn('Gemini intent classification fallback to rule-based:', err);
      detectedIntent = fallbackIntentClassification(userQuery, extractedOrderId);
    }
  } else {
    detectedIntent = fallbackIntentClassification(userQuery, extractedOrderId);
  }

  traces.push({
    nodeId: 'node-1-classifier',
    nodeName: 'Intent Classifier Node',
    timestamp: new Date().toLocaleTimeString(),
    durationMs: Date.now() - node1Start,
    inputSummary: `Query: "${userQuery.slice(0, 50)}..."`,
    outputSummary: `Intent: ${detectedIntent} | Extracted Order: ${extractedOrderId || 'None'}`,
    status: 'completed'
  });

  // NODE 2: Router & Tool Execution Node
  const node2Start = Date.now();

  if (
    detectedIntent === 'ORDER_QUERY' ||
    (extractedOrderId &&
      (userQuery.toLowerCase().includes('order') ||
        userQuery.toLowerCase().includes('package') ||
        userQuery.toLowerCase().includes('track')))
  ) {
    if (extractedOrderId) {
      const foundOrder = await prisma.order.findUnique({
        where: { orderId: extractedOrderId }
      });

      if (foundOrder) {
        orderData = foundOrder;
        toolCalls.push({
          toolName: 'PrismaOrderLookupTool',
          params: { orderId: extractedOrderId },
          resultSummary: `Found order ${extractedOrderId} in Prisma DB - Status: ${orderData.status}`
        });
      } else {
        toolCalls.push({
          toolName: 'PrismaOrderLookupTool',
          params: { orderId: extractedOrderId },
          resultSummary: `Order ${extractedOrderId} not found in Prisma database.`
        });
      }
    }
  }

  if (detectedIntent === 'COMPLAINT') {
    if (userQuery.length > 10) {
      createdTicket = await prisma.supportTicket.create({
        data: {
          customerName:
            (sessionContext && sessionContext.customerName) ||
            (orderData ? orderData.customerName : 'Valued Customer'),
          email: `${((sessionContext && sessionContext.customerName) || 'customer')
            .toLowerCase()
            .replace(/\s+/g, '.')}@example.com`,
          orderId: extractedOrderId || 'N/A',
          category: complaintCategory || determineComplaintCategory(userQuery),
          description: userQuery,
          priority:
            userQuery.toLowerCase().includes('urgent') ||
            userQuery.toLowerCase().includes('broken')
              ? 'High'
              : 'Medium',
          status: 'Open'
        }
      });

      toolCalls.push({
        toolName: 'PrismaTicketCreatorTool',
        params: {
          ticketNumber: createdTicket.id,
          orderId: extractedOrderId,
          category: createdTicket.category
        },
        resultSummary: `Support Ticket ${createdTicket.id} persisted to PostgreSQL via Prisma ORM!`
      });
    }
  }

  // RAG Retrieval Node
  if (
    detectedIntent === 'FAQ' ||
    detectedIntent === 'UNKNOWN' ||
    (!orderData && !createdTicket)
  ) {
    retrievedChunks = await retrievePineconeChunks(userQuery, 3);

    const highestScore =
      retrievedChunks.length > 0 ? retrievedChunks[0].similarityScore || 0 : 0;
    if (highestScore < 0.2) {
      isLowConfidence = true;
    }

    toolCalls.push({
      toolName: 'PineconeRAGRetrieverTool',
      params: { query: userQuery, topK: 3 },
      resultSummary: `Retrieved ${retrievedChunks.length} chunks from Pinecone. Top match score: ${Math.round(highestScore * 100)}%`
    });
  }

  traces.push({
    nodeId: 'node-2-router',
    nodeName: 'Workflow Router & Tool Execution Node',
    timestamp: new Date().toLocaleTimeString(),
    durationMs: Date.now() - node2Start,
    inputSummary: `Routed via ${detectedIntent}`,
    outputSummary: `Tools executed: ${toolCalls.map(t => t.toolName).join(', ') || 'None'}`,
    status: 'completed'
  });

  // NODE 3: Response Synthesizer Node
  const node3Start = Date.now();
  let generatedReply = '';

  if (detectedIntent === 'OUT_OF_SCOPE') {
    generatedReply = `I am **ShopAssist AI**, designed specifically to assist you with e-commerce customer support, such as order tracking, refund & return policies, product details, warranty claims, and ticket registration.\n\nHow may I help you with your order or shop experience today?`;
  } else if (ai) {
    try {
      const ragContextText = retrievedChunks
        .map(c => `[Source: ${c.fileName} (${c.docTitle})]\n${c.text}`)
        .join('\n\n');
      const orderContextText = orderData
        ? `[ORDER DATA ATTACHED FROM PRISMA DB]\nOrder ID: ${orderData.orderId}\nCustomer: ${orderData.customerName}\nStatus: ${orderData.status}\nCarrier: ${orderData.carrier || 'N/A'}\nTracking: ${orderData.trackingNumber || 'N/A'}\nEstimated Delivery: ${orderData.estimatedDelivery || 'N/A'}\nItems: ${orderData.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}`
        : '';
      const ticketContextText = createdTicket
        ? `[SUPPORT TICKET CREATED IN PRISMA DB]\nTicket ID: ${createdTicket.id}\nCategory: ${createdTicket.category}\nStatus: ${createdTicket.status}\nPriority: ${createdTicket.priority}`
        : '';

      const systemInstruction = `You are ShopAssist AI, an empathetic, highly accurate e-commerce customer support assistant.
Strictly adhere to these instructions:
1. Ground your answers strictly in the provided [KNOWLEDGE BASE CONTEXT], [ORDER DATA], or [SUPPORT TICKET] information below.
2. Never invent policies, prices, delivery dates, or promises that are not in the provided context.
3. If no relevant information is present or confidence is low, acknowledge it politely and offer to create a support ticket.
4. Format your response cleanly using Markdown, bolding key terms, using lists for clear steps, and showing empathy.
5. If an Order ID or Support Ticket was created, highlight it clearly in a bold summary box.`;

      const promptParts = [];
      if (ragContextText) promptParts.push(`[KNOWLEDGE BASE CONTEXT (PINECONE RAG)]:\n${ragContextText}`);
      if (orderContextText) promptParts.push(orderContextText);
      if (ticketContextText) promptParts.push(ticketContextText);
      promptParts.push(`[USER QUERY]: ${userQuery}`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: promptParts.join('\n\n'),
        config: {
          systemInstruction
        }
      });

      generatedReply =
        response.text || 'I am sorry, I was unable to generate a response at this moment.';
    } catch (err) {
      console.warn('Gemini response synthesis error, falling back to rule-based response:', err);
      generatedReply = constructFallbackReply(
        detectedIntent,
        userQuery,
        orderData,
        createdTicket,
        retrievedChunks,
        extractedOrderId
      );
    }
  } else {
    generatedReply = constructFallbackReply(
      detectedIntent,
      userQuery,
      orderData,
      createdTicket,
      retrievedChunks,
      extractedOrderId
    );
  }

  traces.push({
    nodeId: 'node-3-synthesizer',
    nodeName: 'Grounded Response Synthesizer Node',
    timestamp: new Date().toLocaleTimeString(),
    durationMs: Date.now() - node3Start,
    inputSummary: `Grounded synthesis using ${retrievedChunks.length} RAG chunks + tools`,
    outputSummary: `Generated ${generatedReply.length} chars response.`,
    status: 'completed'
  });

  return {
    reply: generatedReply,
    intent: detectedIntent,
    workflowTrace: traces,
    retrievedChunks,
    toolCalls,
    createdTicket,
    orderData,
    isLowConfidence
  };
}

// Helpers
function extractOrderIdFromText(text) {
  const match = text.match(/ORD-\d{4}/i);
  return match ? match[0].toUpperCase() : null;
}

function fallbackIntentClassification(query, orderId) {
  const q = query.toLowerCase();
  if (
    q.includes('joke') ||
    q.includes('weather') ||
    q.includes('recipe') ||
    q.includes('president') ||
    q.includes('code')
  ) {
    return 'OUT_OF_SCOPE';
  }
  if (
    q.includes('damaged') ||
    q.includes('broken') ||
    q.includes('wrong') ||
    q.includes('missing') ||
    q.includes('complaint') ||
    q.includes('defect')
  ) {
    return 'COMPLAINT';
  }
  if (
    orderId ||
    q.includes('order') ||
    q.includes('track') ||
    q.includes('package') ||
    q.includes('shipped') ||
    q.includes('delivery')
  ) {
    return 'ORDER_QUERY';
  }
  if (
    q.includes('refund') ||
    q.includes('return') ||
    q.includes('warranty') ||
    q.includes('shipping') ||
    q.includes('pay') ||
    q.includes('faq')
  ) {
    return 'FAQ';
  }
  return 'FAQ';
}

function determineComplaintCategory(query) {
  const q = query.toLowerCase();
  if (q.includes('damage') || q.includes('broken') || q.includes('crack'))
    return 'Damaged Product';
  if (q.includes('wrong') || q.includes('different item')) return 'Wrong Product';
  if (q.includes('missing') || q.includes('empty box')) return 'Missing Package';
  if (q.includes('late') || q.includes('delay') || q.includes('stuck')) return 'Late Delivery';
  if (q.includes('defect') || q.includes('not working') || q.includes("won't turn on"))
    return 'Defective Product';
  return 'General Inquiry';
}

function constructFallbackReply(
  intent,
  query,
  orderData,
  createdTicket,
  chunks,
  orderId
) {
  if (orderData) {
    return `### 📦 Order Status for **${orderData.orderId}** (Retrieved via Prisma ORM)

- **Customer:** ${orderData.customerName}
- **Status:** **${orderData.status}**
- **Carrier:** ${orderData.carrier || 'Standard Carrier'}
- **Tracking Number:** \`${orderData.trackingNumber || 'Processing'}\`
- **Estimated Delivery:** ${orderData.estimatedDelivery || 'N/A'}

**Items in Order:**
${orderData.items.map(i => `- ${i.name} (Qty: ${i.quantity}) - $${i.price}`).join('\n')}

*If you need further assistance or wish to request a return, please let me know!*`;
  }

  if (createdTicket) {
    return `### 🎟️ Support Ticket Registered (Stored in PostgreSQL via Prisma)

We have created support ticket **#${createdTicket.id}** for your request.

- **Category:** ${createdTicket.category}
- **Priority:** ${createdTicket.priority}
- **Status:** **${createdTicket.status}**
- **Order ID:** ${createdTicket.orderId}

Our dedicated customer support team has been notified and will review your issue within 24 hours.`;
  }

  if (orderId && !orderData) {
    return `I searched our Prisma order database for Order **${orderId}**, but I could not find a matching record. Please double-check your Order ID or provide your email address so I can locate your purchase.`;
  }

  if (chunks.length > 0) {
    return `### 📖 Information from Knowledge Base (Pinecone RAG)

${chunks[0].text}

---
*Grounded response from markdown document: **${chunks[0].docTitle}** (${chunks[0].fileName})*`;
  }

  return `Thank you for reaching out to **ShopAssist AI**. I searched our documentation regarding your request ("${query}"), but could not find a high-confidence match. 

Would you like me to register a **Support Ticket** so our human customer support representative can investigate this for you?`;
}
