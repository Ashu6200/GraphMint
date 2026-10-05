import { createServer } from '@graphmint/service-config';
import app from './app.js';

createServer(app, 3000, 'GATEWAY_PORT');
