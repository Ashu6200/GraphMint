import { createServer } from '@graphmint/service-config';
import app from './app.js';

createServer(app, 3001, 'CORE_SERVICE_PORT');
