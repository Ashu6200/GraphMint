import { coreApi } from './services/core.js';
import { platformApi } from './services/platform.js';
import { aiApi } from './services/ai.js';
import { importExportApi } from './services/importExport.js';

export * from './client.js';
export * from './endpoints.js';
export * from './queryKeys.js';
export * from './hooks/index.js';
export * from './provider.jsx';

export { coreApi, platformApi, aiApi, importExportApi };

/**
 * Unified API Client for GraphMint
 */
export const api = {
  core: coreApi,
  platform: platformApi,
  ai: aiApi,
  importExport: importExportApi,
};

export default api;
