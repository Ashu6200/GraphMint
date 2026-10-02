import { createServer } from '@graphmint/service-config';
import app from './app.js';

createServer(app, 3003, 'IMPORT_EXPORT_SERVICE_PORT');

