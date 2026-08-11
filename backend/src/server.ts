import 'dotenv/config';
import app from './app';
import { config } from './config';
import { prisma } from './config/prisma';
import { startReminderScheduler } from './utils/scheduler';

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      if (config.nodeEnv !== 'test') startReminderScheduler();
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
