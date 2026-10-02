import { createServer } from '@graphmint/service-config';
import app from './app.js';

createServer(app, 3002, 'AI_SERVICE_PORT');

