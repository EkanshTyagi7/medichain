import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding MediChain demo data...\n");

  const citizen = await prisma.user.upsert({
    where: { email: "patient@medichain.demo" },
    update: {},
    create: {
      name: "Rahul Sharma",
      email: "patient@medichain.demo",
      role: "CITIZEN",
      abhaId: "12-3456-7890-1234",
      digilockerId: "DL-PATIENT-001",
      walletAddress: "0x1111111111111111111111111111111111111111",
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: "doctor@medichain.demo" },
    update: {},
    create: {
      name: "Dr. Priya Mehta",
      email: "doctor@medichain.demo",
      role: "DOCTOR",
      digilockerId: "DL-DOCTOR-001",
      walletAddress: "0x2222222222222222222222222222222222222222",
    },
  });

  const pharmacy = await prisma.user.upsert({
    where: { email: "pharmacy@medichain.demo" },
    update: {},
    create: {
      name: "Apollo Pharmacy — Koramangala",
      email: "pharmacy@medichain.demo",
      role: "PHARMACY",
      digilockerId: "DL-PHARMACY-001",
      walletAddress: "0x3333333333333333333333333333333333333333",
    },
  });

  const regulator = await prisma.user.upsert({
    where: { email: "regulator@medichain.demo" },
    update: {},
    create: {
      name: "Gov. Health Audit Officer",
      email: "regulator@medichain.demo",
      role: "REGULATOR",
      digilockerId: "DL-REGULATOR-001",
    },
  });

  const prescription = await prisma.prescription.upsert({
    where: { prescriptionId: "0xabc123demo00000000000000000000000000001" },
    update: {},
    create: {
      prescriptionId: "0xabc123demo00000000000000000000000000001",
      doctorId: doctor.id,
      patientId: citizen.id,
      ipfsHash: "QmDemoPrescriptionHash123456789abcdef",
      status: "CREATED",
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            medicineName: "Paracetamol 500mg",
            dosage: "500mg",
            duration: "5 days",
            quantity: 10,
            instructions: "Take after meals, twice daily",
          },
          {
            medicineName: "Amoxicillin 250mg",
            dosage: "250mg",
            duration: "7 days",
            quantity: 14,
            instructions: "Take one capsule every 8 hours",
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: doctor.id,
      role: "DOCTOR",
      action: "PRESCRIPTION_CREATED",
      entityId: prescription.id,
      txHash: "0xdemo_tx_hash_prescription_created",
    },
  });

  await prisma.notification.create({
    data: {
      userId: citizen.id,
      title: "New Prescription",
      message: `Dr. ${doctor.name} issued a new prescription. Show the QR code at your pharmacy.`,
      isRead: false,
    },
  });

  await prisma.medicineBatch.upsert({
    where: { batchNumber: "BATCH-DEMO-2026-001" },
    update: {},
    create: {
      medicineName: "Paracetamol 500mg",
      batchNumber: "BATCH-DEMO-2026-001",
      manufacturer: "MediCorp Labs",
      expiryDate: new Date("2027-12-31"),
      ipfsHash: "QmDemoBatchHash001",
    },
  });

  console.log("Users:");
  console.log(`  Citizen   → ${citizen.email}`);
  console.log(`  Doctor    → ${doctor.email}`);
  console.log(`  Pharmacy  → ${pharmacy.email}`);
  console.log(`  Regulator → ${regulator.email}`);
  console.log(`\nPrescription: ${prescription.prescriptionId}`);
  console.log(`  Items: ${prescription.items.length}`);
  console.log("\nSeed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
