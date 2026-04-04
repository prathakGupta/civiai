import app from "./app.js";
import { prisma } from "./lib/prisma.js";

const PORT = process.env.PORT || 5000;

async function ensureDatabaseReady() {
  await prisma.$connect();
  await prisma.complaint.count();
}

async function startServer() {
  try {
    await ensureDatabaseReady();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const code = error?.code ? ` (${error.code})` : "";

    console.error(`Failed to start server${code}: ${error?.message || error}`);

    if (error?.code === "P2021" || error?.code === "P2022") {
      console.error(
        "Database schema is out of sync. Run `npm run prisma:migrate` (local) or `npm run prisma:migrate:deploy` (deploy)."
      );
    }

    process.exit(1);
  }
}

startServer();
