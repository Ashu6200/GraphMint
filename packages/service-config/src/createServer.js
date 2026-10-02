const SHUTDOWN_TIMEOUT_MS = 5000;

export function createServer(app, defaultPort, portEnvKey) {
  const start = async () => {
    const port =
      Number(portEnvKey ? process.env[portEnvKey] : null) ||
      Number(process.env.PORT) ||
      defaultPort;

    try {
      await app.listen({ port });
    } catch (error) {
      app.log.error({ err: error }, 'Failed to start server');
      process.exit(1);
    }
  };

  const shutdown = async (signal) => {
    app.log.info({ signal }, 'Shutdown signal received, closing server gracefully');
    const timer = setTimeout(() => {
      app.log.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    timer.unref();

    try {
      await app.close();
      clearTimeout(timer);
      app.log.info('Server closed cleanly');
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'Error during shutdown');
      clearTimeout(timer);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    app.log.error({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });

  start();
}
