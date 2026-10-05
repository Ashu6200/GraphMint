import { http } from '../client.js';
import { ENDPOINTS } from '../endpoints.js';

export const importExportApi = {
  /**
   * Health check for import-export service
   */
  getHealth: () => http.get(ENDPOINTS.IMPORT_EXPORT.HEALTH),

  /**
   * Import & Export operations
   */
  exportGraph: (format = 'json', graphId) =>
    http.get(ENDPOINTS.IMPORT_EXPORT.EXPORT(format), { params: { graphId } }),
  importGraph: (data) => http.post(ENDPOINTS.IMPORT_EXPORT.IMPORT, data),
};
