import { prisma } from './index.js';

async function checkDatabaseConnection() {
  const maxRetries = 20;
  const delayMs = 1000;

  console.log('⏳ Waiting for database to be ready...');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database is connected and ready! Starting services...\n');
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`❌ Could not connect to database after ${maxRetries} attempts.`);
        console.error(`   Error: ${err.message}`);
        console.error('   Please ensure your database or "pnpm db:dev" is running.\n');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

checkDatabaseConnection();
