import 'dotenv/config';
import app from './app.js';
import { createServer } from '@graphmint/service-config';

createServer(app, 3001);
