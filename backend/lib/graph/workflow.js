import { StateGraph, START, END } from '@langchain/langgraph';
import { StateAnnotation } from './state.js';
import { agentNode, toolExecutionNode } from './nodes.js';

// Route function to determine next step after agent evaluation
function routeAfterAgent(state) {
  const { pendingToolCall, iterationCount } = state;

  // Maximum 3 model/tool cycles to prevent infinite loops
  if (iterationCount >= 3) {
    return END;
  }

  // If the agent requested a tool, route to toolExecutionNode
  if (pendingToolCall && pendingToolCall.name) {
    return 'toolExecutionNode';
  }

  // Otherwise, the agent has provided a final text response
  return END;
}

const workflow = new StateGraph(StateAnnotation)
  .addNode('agentNode', agentNode)
  .addNode('toolExecutionNode', toolExecutionNode)

  // Start conditionally based on pre-router
  .addConditionalEdges(START, (state) => state.pendingToolCall ? 'toolExecutionNode' : 'agentNode')

  // After the agent acts, conditionally route to a tool or END
  .addConditionalEdges('agentNode', routeAfterAgent)

  // After a tool executes, ALWAYS return back to the agent for evaluation
  .addEdge('toolExecutionNode', 'agentNode');

// Compile into runnable graph
export const supportWorkflowGraph = workflow.compile();
