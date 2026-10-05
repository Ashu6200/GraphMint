import { http } from '../client.js';
import { ENDPOINTS } from '../endpoints.js';

export const aiApi = {
  /**
   * Health check for AI microservice
   */
  getHealth: () => http.get(ENDPOINTS.AI.HEALTH),

  /**
   * AI Graph Generation & Suggestion
   */
  generateGraph: (promptData) => http.post(ENDPOINTS.AI.GENERATE_GRAPH, promptData),
  suggestNodes: (context) => http.post(ENDPOINTS.AI.SUGGEST_NODES, context),
  analyzeGraph: (graphData) => http.post(ENDPOINTS.AI.ANALYZE, graphData),
  chat: (messages) => http.post(ENDPOINTS.AI.CHAT, { messages }),
};
