import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  await prisma.complaint.deleteMany();

  const c1 = await prisma.complaint.create({
    data: {
      status: "RESOLVED",
      issueType: "POTHOLE",
      severity: "HIGH",
      locationText: "100ft Road, Indiranagar",
      description: "Massive crater on the left lane.",
      reportedByName: "Rahul K.",
      reportedByEmail: "rahul@example.com",
      aiSummary: "Large pothole in primary lane",
      aiConfidence: 0.95,
      department: "Roads & Infrastructure",
      verification: {
        create: {
          verificationStatus: "RESOLVED",
          verificationSummary: "Pothole filled and leveled check passed.",
          verificationConfidence: 0.98,
          beforeImageUrl: "https://via.placeholder.com/600",
          afterImageUrl: "https://via.placeholder.com/600",
        }
      }
    }
  });

  const c2 = await prisma.complaint.create({
    data: {
      status: "PENDING",
      issueType: "GARBAGE",
      severity: "MEDIUM",
      locationText: "Koramangala 4th Block Park",
      description: "Bin overflow for 3 days.",
      reportedByName: "Priya S.",
      reportedByEmail: "priya@example.com",
      aiSummary: "Garbage bin overflowing onto sidewalk",
      aiConfidence: 0.88,
      department: "Waste Management"
    }
  });

  const c3 = await prisma.complaint.create({
    data: {
      status: "ASSIGNED",
      issueType: "STREETLIGHT",
      severity: "LOW",
      locationText: "HSR Layout Sector 2",
      description: "Streetlight flickering.",
      reportedByName: "Amit",
      aiSummary: "Flickering street lamp pole #34",
      aiConfidence: 0.72,
      department: "Electrical"
    }
  });

  console.log(`Seeded complaints: ${c1.id}, ${c2.id}, ${c3.id}`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
