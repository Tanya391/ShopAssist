import { Annotation } from '@langchain/langgraph';

// Reducer function to concatenate arrays rather than overwriting
const concatArray = (a, b) => {
  if (!a && !b) return [];
  if (!a) return Array.isArray(b) ? b : [b];
  if (!b) return Array.isArray(a) ? a : [a];
  return [...a, ...(Array.isArray(b) ? b : [b])];
};

export const StateAnnotation = Annotation.Root({
  userMessage: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  history: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  sessionContext: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ({}),
  }),
  
  // Agentic Fields
  agentMessages: Annotation({
    reducer: concatArray,
    default: () => [],
  }),
  iterationCount: Annotation({
    reducer: (x, y) => x + (y || 0),
    default: () => 0,
  }),
  geminiCallCount: Annotation({
    reducer: (x, y) => x + (y || 0),
    default: () => 0,
  }),
  toolCallCount: Annotation({
    reducer: (x, y) => x + (y || 0),
    default: () => 0,
  }),
  executedTools: Annotation({
    reducer: concatArray,
    default: () => [],
  }),
  pendingToolCall: Annotation({
    reducer: (x, y) => (y === null ? null : (y ?? x)),
    default: () => null,
  }),

  // Legacy Fields (preserved for API mapping)
  intent: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'UNKNOWN',
  }),
  extractedOrderId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  complaintCategory: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'General Inquiry',
  }),
  orderData: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  createdTicket: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  retrievedChunks: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  isLowConfidence: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  toolCalls: Annotation({
    reducer: concatArray,
    default: () => [],
  }),
  workflowTrace: Annotation({
    reducer: concatArray,
    default: () => [],
  }),
  generatedReply: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
});
