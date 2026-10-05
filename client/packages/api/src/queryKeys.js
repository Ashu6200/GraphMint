/**
 * Centralized Query Keys factory for TanStack Query
 */
export const queryKeys = {
  core: {
    all: ['core'],
    health: () => [...queryKeys.core.all, 'health'],
    graphs: () => [...queryKeys.core.all, 'graphs'],
    graph: (id) => [...queryKeys.core.graphs(), id],
    nodes: (graphId) => [...queryKeys.core.graph(graphId), 'nodes'],
    edges: (graphId) => [...queryKeys.core.graph(graphId), 'edges'],
    projects: () => [...queryKeys.core.all, 'projects'],
  },
  platform: {
    all: ['platform'],
    health: () => [...queryKeys.platform.all, 'health'],
    user: () => [...queryKeys.platform.all, 'user'],
    users: (params) => [...queryKeys.platform.all, 'users', params],
    settings: () => [...queryKeys.platform.all, 'settings'],
    organizations: () => [...queryKeys.platform.all, 'organizations'],
  },
  ai: {
    all: ['ai'],
    health: () => [...queryKeys.ai.all, 'health'],
  },
  importExport: {
    all: ['importExport'],
    health: () => [...queryKeys.importExport.all, 'health'],
  },
};
