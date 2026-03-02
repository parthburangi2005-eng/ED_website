import { prisma } from "../server/prisma";

const cities = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
];
const labPrefixes = [
  "Research",
  "Testing",
  "Quality",
  "Production",
  "Development",
  "Analysis",
  "Prototype",
  "Innovation",
  "Material",
  "Advanced",
];

const materials = [
  { name: "PLA Filament", category: "3D Printing", unit: "kg" },
  { name: "ABS Filament", category: "3D Printing", unit: "kg" },
  { name: "UV Resin Standard", category: "Resin", unit: "L" },
  { name: "Flexible Resin", category: "Resin", unit: "L" },
  { name: "Nylon Powder", category: "Raw Material", unit: "kg" },
  { name: "Carbon Fiber Sheet", category: "Raw Material", unit: "pcs" },
  { name: "Epoxy Adhesive", category: "Consumable", unit: "L" },
  { name: "Isopropyl Alcohol", category: "Consumable", unit: "L" },
  { name: "Silicone Mold", category: "Consumable", unit: "pcs" },
  { name: "Sandpaper Assorted", category: "Consumable", unit: "pcs" },
];

const equipmentTypes = [
  { name: "FDM 3D Printer", type: "3D Printer", manufacturer: "Stratasys", model: "F370", interval: 90 },
  { name: "SLA 3D Printer", type: "3D Printer", manufacturer: "Formlabs", model: "Form 3L", interval: 60 },
  { name: "CNC Milling Machine", type: "CNC", manufacturer: "Haas", model: "VF-2", interval: 120 },
  { name: "Laser Cutter", type: "Laser", manufacturer: "Epilog", model: "Fusion Pro", interval: 45 },
  { name: "Injection Mold Press", type: "Press", manufacturer: "Arburg", model: "370A", interval: 180 },
  { name: "Thermal Chamber", type: "Testing", manufacturer: "Thermotron", model: "SE-600", interval: 150 },
  { name: "Tensile Tester", type: "Testing", manufacturer: "Instron", model: "5967", interval: 365 },
  { name: "Vacuum Oven", type: "Oven", manufacturer: "Across Intl", model: "AT29", interval: 90 },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

async function main() {
  await prisma.alert.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.lab.deleteMany();

  const labs = await Promise.all(
    Array.from({ length: 85 }, (_, i) => {
      const city = cities[i % cities.length];
      const prefix = labPrefixes[i % labPrefixes.length];
      return prisma.lab.create({
        data: {
          code: `LAB-${String(i + 1).padStart(3, "0")}`,
          name: `${prefix} Lab ${city} ${Math.floor(i / 10) + 1}`,
          city,
        },
      });
    })
  );

  for (const lab of labs) {
    for (const material of materials) {
      const maxCap = Math.floor(rand(50, 200));
      const minThresh = Math.floor(maxCap * 0.2);
      const current = Math.floor(rand(0, maxCap));
      await prisma.inventoryItem.create({
        data: {
          name: material.name,
          category: material.category,
          unit: material.unit,
          currentStock: current,
          minThreshold: minThresh,
          maxCapacity: maxCap,
          lastUpdated: new Date(Date.now() - rand(0, 7 * 24 * 60 * 60 * 1000)),
          labId: lab.id,
        },
      });
    }
  }

  for (const lab of labs) {
    for (const eq of equipmentTypes) {
      const lastService = new Date(Date.now() - rand(0, eq.interval * 24 * 60 * 60 * 1000));
      await prisma.equipment.create({
        data: {
          name: eq.name,
          type: eq.type,
          manufacturer: eq.manufacturer,
          model: eq.model,
          serviceIntervalDays: eq.interval,
          lastService,
          labId: lab.id,
        },
      });
    }
  }

  const firstFiveLabs = labs.slice(0, 5);
  const alertTemplates = [
    { type: "inventory" as const, severity: "critical" as const, message: "PLA Filament critically low (2kg remaining)" },
    { type: "equipment" as const, severity: "critical" as const, message: "SLA 3D Printer overdue for maintenance by 12 days" },
    { type: "inventory" as const, severity: "warning" as const, message: "UV Resin stock below threshold (5L remaining)" },
    { type: "equipment" as const, severity: "warning" as const, message: "Laser Cutter maintenance due in 5 days" },
    { type: "inventory" as const, severity: "critical" as const, message: "Carbon Fiber Sheet out of stock" },
  ];

  await Promise.all(
    alertTemplates.map((alert, idx) =>
      prisma.alert.create({
        data: {
          ...alert,
          read: idx > 2,
          labId: firstFiveLabs[idx % firstFiveLabs.length]?.id,
          createdAt: new Date(Date.now() - (idx + 1) * 30 * 60 * 1000),
        },
      })
    )
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.stdout.write("Database seeded successfully.\n");
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    process.stderr.write(`Seed failed: ${e}\n`);
    process.exit(1);
  });
