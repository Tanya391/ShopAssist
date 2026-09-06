import { toolsDeclarations, toolExecutors } from './tools.js';
import { constructFallbackReply, fallbackIntentClassification } from './helpers.js';
import { generateGeminiContent } from '../ai/geminiClient.js';

export async function agentNode(state) {
  const nodeStart = Date.now();
  const { userMessage, history, agentMessages, geminiCallCount, toolCallCount } = state;

  const maxGeminiCalls = parseInt(process.env.GEMINI_MAX_CALLS_PER_REQUEST || '3', 10);
  
  if (geminiCallCount >= maxGeminiCalls) {
    console.warn(`[AgentNode] Reached max gemini calls (${maxGeminiCalls}). Terminating loop.`);
    return {
      generatedReply: "I'm having trouble processing your request fully right now. Would you like me to create a support ticket?",
      pendingToolCall: null,
      workflowTrace: [{
        nodeId: 'node-agent-limit',
        nodeName: 'Agent Budget Limit',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: Date.now() - nodeStart,
        inputSummary: 'Checked Gemini call budget.',
        outputSummary: 'Terminated graph due to call budget exhaustion.',
        status: 'completed'
      }]
    };
  }



  // 2. Format history by appending intermediate agent/tool messages to the initial prompt
  let messagesToSend = [];
  
  // Incorporate session history
  if (history && history.length > 0) {
    for (const msg of history) {
      messagesToSend.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }
  }
  
  // Add current user message
  messagesToSend.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });
  
  // Append any intermediate tool calls and responses generated during this graph execution
  if (agentMessages && agentMessages.length > 0) {
    messagesToSend = messagesToSend.concat(agentMessages);
  }

  const systemInstruction = `You are ShopAssist AI, an e-commerce customer support assistant.
Provide crisp, refined, and highly readable answers.
Format your responses using Markdown (e.g., bolding key terms, using bullet points for lists) to make the text look good and easy to understand.
You have access to tools that provide authoritative information.
Never invent:
- order information
- order status
- tracking information
- ticket IDs
- refund policies
- shipping policies
- warranty policies
- product information
When authoritative information is required, use the appropriate tool.
Use getOrderById when the user asks about a specific order.
Use searchKnowledgeBase when answering questions about company policies, shipping, returns, refunds, warranties, or product information.
Use createSupportTicket when the user reports a complaint that requires support intervention.
Never create a support ticket merely because the user asks a general question.
Never create more than one support ticket during a single request.
If a tool fails, clearly explain that the information or service is temporarily unavailable.
If you have sufficient information and no tool is required, answer directly.
Do not claim that an action occurred unless the corresponding tool successfully completed it.`;

  try {
    const response = await generateGeminiContent({
      contents: messagesToSend,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolsDeclarations }]
      }
    });

    const functionCalls = response.functionCalls || [];
    const textPart = response.text;

    // Handle tool call request
    if (functionCalls.length > 0) {
      const toolCall = functionCalls[0]; // Process one tool at a time for simplicity
      const trace = {
        nodeId: 'node-agent',
        nodeName: 'Agent Decision Node',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: Date.now() - nodeStart,
        inputSummary: 'Evaluated user message and history.',
        outputSummary: `Agent requested ${toolCall.name} tool.`,
        status: 'completed'
      };

      return {
        pendingToolCall: { name: toolCall.name, args: toolCall.args },
        agentMessages: [{ role: 'model', parts: response.candidates[0].content.parts }],
        geminiCallCount: 1, // Reducer increments
        workflowTrace: [trace]
      };
    }

    // Handle final text response
    const generatedReply = textPart || 'I am sorry, I am unable to process your request at this time.';
    
    const trace = {
      nodeId: 'node-agent',
      nodeName: 'Agent Decision Node',
      timestamp: new Date().toLocaleTimeString(),
      durationMs: Date.now() - nodeStart,
      inputSummary: 'Evaluated state and tool responses.',
      outputSummary: 'Generated final response.',
      status: 'completed'
    };

    return {
      generatedReply,
      pendingToolCall: null, // Clear any pending tool
      agentMessages: [{ role: 'model', parts: [{ text: generatedReply }] }],
      geminiCallCount: 1,
      workflowTrace: [trace]
    };

  } catch (err) {
    if (err.code === 'CLIENT_MISSING' || err.code === 'QUOTA_EXHAUSTED') {
      console.warn(`[AgentNode] Gemini error (${err.code}):`, err.message);
    } else {
      console.warn('[AgentNode] Gemini generation error, falling back to rule-based response:', err.message);
    }
    
    const fallbackIntent = fallbackIntentClassification(userMessage, null);
    return {
      generatedReply: constructFallbackReply(fallbackIntent, userMessage, state.orderData, state.createdTicket, state.retrievedChunks, null),
      intent: fallbackIntent,
      workflowTrace: [{
        nodeId: 'node-agent',
        nodeName: 'Agent Decision Node',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: Date.now() - nodeStart,
        inputSummary: `Gemini API Error: ${err.code || 'UNKNOWN'}`,
        outputSummary: 'Generated fallback reply.',
        status: 'completed'
      }]
    };
  }
}

export async function toolExecutionNode(state) {
  const nodeStart = Date.now();
  const { pendingToolCall, toolCallCount, executedTools } = state;
  
  if (!pendingToolCall) {
    return { iterationCount: 1 };
  }

  const maxToolCalls = parseInt(process.env.GEMINI_MAX_TOOL_CALLS_PER_REQUEST || '2', 10);
  if (toolCallCount >= maxToolCalls) {
    console.warn(`[ToolNode] Reached max tool calls (${maxToolCalls}). Returning safe error to agent.`);
    return formatToolError(pendingToolCall, 'MAX_TOOL_CALLS_REACHED', 'Maximum tool calls per request exceeded. Please formulate a final answer.');
  }

  // Prevent Duplicate Tool Calls
  const toolSignature = `${pendingToolCall.name}:${JSON.stringify(pendingToolCall.args || {})}`;
  if (executedTools.includes(toolSignature)) {
    console.warn(`[ToolNode] Duplicate tool call detected: ${toolSignature}`);
    return formatToolError(pendingToolCall, 'DUPLICATE_TOOL_CALL', 'This tool was already called with identical arguments during this request. Use existing information instead.');
  }

  const executor = toolExecutors[pendingToolCall.name];
  let toolResultObj;
  let stateUpdates = {};
  
  if (executor) {
    const result = await executor(pendingToolCall.args, state);
    toolResultObj = result.success ? result.result : result;
    if (result.stateUpdate) {
      stateUpdates = result.stateUpdate;
    }
  } else {
    toolResultObj = { success: false, error: 'UNKNOWN_TOOL', message: `The tool ${pendingToolCall.name} does not exist.` };
  }

  // Format the function response for Gemini
  const functionResponsePart = {
    functionResponse: {
      name: pendingToolCall.name,
      response: typeof toolResultObj === 'object' && toolResultObj !== null ? toolResultObj : { result: toolResultObj }
    }
  };

  const trace = {
    nodeId: `node-tool-${pendingToolCall.name}`,
    nodeName: `Tool Execution: ${pendingToolCall.name}`,
    timestamp: new Date().toLocaleTimeString(),
    durationMs: Date.now() - nodeStart,
    inputSummary: `Executing tool with args: ${JSON.stringify(pendingToolCall.args)}`,
    outputSummary: `Tool execution completed.`,
    status: 'completed'
  };

  // We must return the new agentMessage, clear pendingToolCall, increment iteration count, and apply stateUpdates
  return {
    ...stateUpdates,
    agentMessages: [{ role: 'user', parts: [functionResponsePart] }],
    pendingToolCall: null,
    iterationCount: 1, 
    toolCallCount: 1,
    executedTools: [toolSignature],
    workflowTrace: [trace],
    // API contract mappings for trace logs
    toolCalls: [{
      toolName: pendingToolCall.name,
      params: pendingToolCall.args,
      resultSummary: typeof toolResultObj === 'string' ? toolResultObj : 'Execution complete'
    }]
  };
}

function formatToolError(pendingToolCall, code, message) {
  return {
    agentMessages: [{
      role: 'user',
      parts: [{
        functionResponse: {
          name: pendingToolCall.name,
          response: { success: false, error: code, message }
        }
      }]
    }],
    pendingToolCall: null,
    toolCallCount: 1
  };
}
