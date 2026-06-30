import 'dotenv/config';
import app from './app.js';

const start = async () => {
  const port = process.env.PORT || 3003;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port: Number(port), host });
    app.log.info(`Import Export service is running on http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
