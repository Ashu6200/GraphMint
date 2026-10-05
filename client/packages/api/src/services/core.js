import { http } from '../client.js';
import { ENDPOINTS } from '../endpoints.js';

export const coreApi = {
  /**
   * Health check for core microservice
   */
  getHealth: () => http.get(ENDPOINTS.CORE.HEALTH),

  /**
   * Graphs API
   */
  getGraphs: (params) => http.get(ENDPOINTS.CORE.GRAPHS, { params }),
  getGraphById: (id) => http.get(ENDPOINTS.CORE.GRAPH_DETAIL(id)),
  createGraph: (data) => http.post(ENDPOINTS.CORE.GRAPHS, data),
  updateGraph: (id, data) => http.put(ENDPOINTS.CORE.GRAPH_DETAIL(id), data),
  deleteGraph: (id) => http.delete(ENDPOINTS.CORE.GRAPH_DETAIL(id)),

  /**
   * Graph Nodes & Edges
   */
  getNodes: (graphId) => http.get(ENDPOINTS.CORE.NODES(graphId)),
  createNode: (graphId, data) => http.post(ENDPOINTS.CORE.NODES(graphId), data),
  getEdges: (graphId) => http.get(ENDPOINTS.CORE.EDGES(graphId)),
  createEdge: (graphId, data) => http.post(ENDPOINTS.CORE.EDGES(graphId), data),

  /**
   * Projects
   */
  getProjects: () => http.get(ENDPOINTS.CORE.PROJECTS),
  createProject: (data) => http.post(ENDPOINTS.CORE.PROJECTS, data),
};
