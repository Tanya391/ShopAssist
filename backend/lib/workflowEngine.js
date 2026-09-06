import { supportWorkflowGraph } from './graph/workflow.js';

export async function processSupportWorkflow(
  userQuery,
  history,
  sessionContext
) {
  // 1. Truncate History to MAX_HISTORY_MESSAGES
  const maxHistory = parseInt(process.env.MAX_HISTORY_MESSAGES || '10', 10);
  const boundedHistory = (history || []).slice(-maxHistory);

  // 2. Deterministic Pre-Routing to save Gemini quota on simple matches
  let pendingToolCall = null;
  const qStr = (userQuery || '').toLowerCase();
  
  if (/where is my order/i.test(qStr) || /order status/i.test(qStr) || /track my order/i.test(qStr)) {
    const orderMatch = userQuery.match(/(ORD-\d+)/i);
    if (orderMatch) {
      pendingToolCall = { name: 'getOrderById', args: { orderId: orderMatch[1].toUpperCase() } };
    }
  } else if (/refund policy/i.test(qStr) || /return policy/i.test(qStr) || /shipping policy/i.test(qStr)) {
    pendingToolCall = { name: 'searchKnowledgeBase', args: { query: userQuery } };
  }

  // 3. Initialize LangGraph state
  const initialState = {
    userMessage: userQuery,
    history: boundedHistory,
    sessionContext: sessionContext || {},
    intent: 'UNKNOWN',
    extractedOrderId: null,
    complaintCategory: 'General Inquiry',
    orderData: null,
    createdTicket: null,
    retrievedChunks: [],
    isLowConfidence: false,
    toolCalls: [],
    workflowTrace: [],
    generatedReply: '',
    agentMessages: [],
    iterationCount: 0,
    geminiCallCount: 0,
    toolCallCount: 0,
    executedTools: [],
    pendingToolCall
  };

  // 4. Execute the compiled LangGraph workflow
  const finalState = await supportWorkflowGraph.invoke(initialState);

  // Derive intent based on tools executed if it wasn't populated by fallback
  let derivedIntent = finalState.intent || 'UNKNOWN';
  if (derivedIntent === 'UNKNOWN' && finalState.toolCalls && finalState.toolCalls.length > 0) {
    const toolNames = finalState.toolCalls.map(t => t.toolName);
    if (toolNames.includes('createSupportTicket')) {
      derivedIntent = 'COMPLAINT';
    } else if (toolNames.includes('getOrderById')) {
      derivedIntent = 'ORDER_QUERY';
    } else if (toolNames.includes('searchKnowledgeBase')) {
      derivedIntent = 'FAQ';
    }
  }

  // 3. Map final state to the exact API contract expected by React / tests
  return {
    reply: finalState.generatedReply,
    intent: derivedIntent,
    retrievedChunks: finalState.retrievedChunks,
    workflowTrace: finalState.workflowTrace,
    orderData: finalState.orderData,
    createdTicket: finalState.createdTicket,
    isLowConfidence: finalState.isLowConfidence,
    toolCalls: finalState.toolCalls,
    ...(process.env.NODE_ENV === 'test' && { geminiCallCount: finalState.geminiCallCount })
  };
}
