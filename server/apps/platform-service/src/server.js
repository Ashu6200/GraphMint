import { createServer } from '@graphmint/service-config';
import app from './app.js';

createServer(app, 3004, 'PLATFORM_SERVICE_PORT');
