import { env } from "./config/env"; // load the .env before prisma
import { prisma } from "@mysagra/database";
import app from "./app";

const server = app.listen(env.PORT, () => {
  console.log(`Server is listening on http://localhost:${env.PORT}`);
  console.log(`Documentation: http://localhost:${env.PORT}/api-docs`);
});

async function shutdown() {
  console.log('Shutting down server...');
  try {
    await prisma.$disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);