/**
 * Standardized API Endpoints for GraphMint Microservices Gateway
 */
export const ENDPOINTS = {
  CORE: {
    HEALTH: '/core/health',
    GRAPHS: '/core/graphs',
    GRAPH_DETAIL: (id) => `/core/graphs/${id}`,
    NODES: (graphId) => `/core/graphs/${graphId}/nodes`,
    EDGES: (graphId) => `/core/graphs/${graphId}/edges`,
    PROJECTS: '/core/projects',
  },
  PLATFORM: {
    HEALTH: '/platform/health',
    AUTH: {
      LOGIN: '/platform/auth/login',
      REGISTER: '/platform/auth/register',
      LOGOUT: '/platform/auth/logout',
      REFRESH: '/platform/auth/refresh',
      ME: '/platform/auth/me',
    },
    USERS: '/platform/users',
    SETTINGS: '/platform/settings',
    ORGANIZATIONS: '/platform/organizations',
  },
  AI: {
    HEALTH: '/ai/health',
    GENERATE_GRAPH: '/ai/generate',
    SUGGEST_NODES: '/ai/suggest',
    ANALYZE: '/ai/analyze',
    CHAT: '/ai/chat',
  },
  IMPORT_EXPORT: {
    HEALTH: '/import-export/health',
    EXPORT: (format) => `/import-export/export?format=${format}`,
    IMPORT: '/import-export/import',
  },
};
