import "dotenv/config";
import cors from "cors";
import express from "express";
import { addDays, differenceInCalendarDays } from "date-fns";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { z } from "zod";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });
const app = express();
const port = Number(process.env.API_PORT ?? 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:8080";
const clerkPublishableKey =
  process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const hasClerkKeys = Boolean(clerkPublishableKey && clerkSecretKey);
const isProduction = process.env.NODE_ENV === "production";

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
if (!hasClerkKeys && isProduction) {
  throw new Error(
    "Missing Clerk keys. Set CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY (or VITE_CLERK_PUBLISHABLE_KEY)."
  );
}

if (hasClerkKeys) {
  app.use(
    clerkMiddleware({
      publishableKey: clerkPublishableKey,
      secretKey: clerkSecretKey,
    })
  );
} else {
  process.stdout.write(
    "[warn] Clerk keys missing. Running API without auth middleware in local mode.\n"
  );
}

function getInventoryStatus(currentStock: number, minThreshold: number): "sufficient" | "low" | "critical" {
  if (currentStock <= minThreshold * 0.5) return "critical";
  if (currentStock <= minThreshold) return "low";
  return "sufficient";
}

function getEquipmentStatus(lastService: Date, serviceIntervalDays: number): "healthy" | "due" | "critical" {
  const nextService = addDays(lastService, serviceIntervalDays);
  const daysUntil = differenceInCalendarDays(nextService, new Date());
  if (daysUntil < 0) return "critical";
  if (daysUntil < 14) return "due";
  return "healthy";
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

if (hasClerkKeys) {
  app.use("/api", requireAuth());
}

app.get("/api/labs", async (req, res) => {
  const querySchema = z.object({
    search: z.string().optional(),
    status: z.enum(["operational", "warning", "critical"]).optional(),
  });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const search = parsed.data.search?.toLowerCase();
  const labs = await prisma.lab.findMany({
    include: { inventoryItems: true, equipment: true, alerts: true },
    orderBy: { code: "asc" },
  });

  const mapped = labs.map((lab) => {
    const inventoryCritical = lab.inventoryItems.filter((i) => getInventoryStatus(i.currentStock, i.minThreshold) === "critical").length;
    const inventoryLow = lab.inventoryItems.filter((i) => getInventoryStatus(i.currentStock, i.minThreshold) === "low").length;
    const equipmentCritical = lab.equipment.filter((e) => getEquipmentStatus(e.lastService, e.serviceIntervalDays) === "critical").length;
    const equipmentDue = lab.equipment.filter((e) => getEquipmentStatus(e.lastService, e.serviceIntervalDays) === "due").length;

    const criticalCount = inventoryCritical + equipmentCritical;
    const warningCount = inventoryLow + equipmentDue;
    const status = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "operational";

    return {
      id: lab.id,
      code: lab.code,
      name: lab.name,
      city: lab.city,
      status,
      inventoryAlerts: inventoryCritical + inventoryLow,
      equipmentAlerts: equipmentCritical + equipmentDue,
    };
  });

  const filtered = mapped.filter((lab) => {
    const bySearch =
      !search ||
      lab.name.toLowerCase().includes(search) ||
      lab.city.toLowerCase().includes(search) ||
      lab.code.toLowerCase().includes(search);
    const byStatus = !parsed.data.status || lab.status === parsed.data.status;
    return bySearch && byStatus;
  });

  return res.json(filtered);
});

app.get("/api/inventory", async (req, res) => {
  const querySchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(["sufficient", "low", "critical"]).optional(),
    labId: z.string().optional(),
  });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const search = parsed.data.search?.toLowerCase();
  const rows = await prisma.inventoryItem.findMany({
    include: { lab: true },
    orderBy: [{ updatedAt: "desc" }],
  });

  const mapped = rows.map((item) => {
    const status = getInventoryStatus(item.currentStock, item.minThreshold);
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      labId: item.labId,
      labName: item.lab.name,
      currentStock: item.currentStock,
      minThreshold: item.minThreshold,
      maxCapacity: item.maxCapacity,
      unit: item.unit,
      lastUpdated: item.lastUpdated,
      status,
    };
  });

  const filtered = mapped.filter((item) => {
    const bySearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.labName.toLowerCase().includes(search);
    const byCategory = !parsed.data.category || parsed.data.category === "All" || item.category === parsed.data.category;
    const byStatus = !parsed.data.status || item.status === parsed.data.status;
    const byLab = !parsed.data.labId || item.labId === parsed.data.labId;
    return bySearch && byCategory && byStatus && byLab;
  });

  return res.json(filtered);
});

app.patch("/api/inventory/:id/stock", async (req, res) => {
  const bodySchema = z.object({
    currentStock: z.number().min(0),
  });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { currentStock: parsed.data.currentStock, lastUpdated: new Date() },
    include: { lab: true },
  });
  return res.json(updated);
});

app.get("/api/equipment", async (req, res) => {
  const querySchema = z.object({
    search: z.string().optional(),
    type: z.string().optional(),
    status: z.enum(["healthy", "due", "critical"]).optional(),
    labId: z.string().optional(),
  });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const search = parsed.data.search?.toLowerCase();
  const rows = await prisma.equipment.findMany({
    include: { lab: true },
    orderBy: [{ updatedAt: "desc" }],
  });

  const mapped = rows.map((eq) => {
    const nextService = addDays(eq.lastService, eq.serviceIntervalDays);
    return {
      id: eq.id,
      name: eq.name,
      type: eq.type,
      labId: eq.labId,
      labName: eq.lab.name,
      lastService: eq.lastService,
      nextService,
      status: getEquipmentStatus(eq.lastService, eq.serviceIntervalDays),
      serviceInterval: eq.serviceIntervalDays,
      manufacturer: eq.manufacturer,
      model: eq.model,
    };
  });

  const filtered = mapped.filter((eq) => {
    const bySearch =
      !search ||
      eq.name.toLowerCase().includes(search) ||
      eq.labName.toLowerCase().includes(search) ||
      eq.manufacturer.toLowerCase().includes(search);
    const byType = !parsed.data.type || parsed.data.type === "All" || eq.type === parsed.data.type;
    const byStatus = !parsed.data.status || eq.status === parsed.data.status;
    const byLab = !parsed.data.labId || eq.labId === parsed.data.labId;
    return bySearch && byType && byStatus && byLab;
  });

  return res.json(filtered);
});

app.patch("/api/equipment/:id/service", async (req, res) => {
  const bodySchema = z.object({
    lastService: z.coerce.date().optional(),
    serviceIntervalDays: z.number().int().positive().optional(),
  });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await prisma.equipment.update({
    where: { id: req.params.id },
    data: {
      ...(parsed.data.lastService ? { lastService: parsed.data.lastService } : {}),
      ...(parsed.data.serviceIntervalDays ? { serviceIntervalDays: parsed.data.serviceIntervalDays } : {}),
    },
  });
  return res.json(updated);
});

app.get("/api/alerts", async (req, res) => {
  const querySchema = z.object({
    read: z.enum(["true", "false"]).optional(),
    type: z.enum(["inventory", "equipment"]).optional(),
    severity: z.enum(["warning", "critical"]).optional(),
  });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const rows = await prisma.alert.findMany({
    include: { lab: true },
    orderBy: { createdAt: "desc" },
  });

  const mapped = rows.map((alert) => ({
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    labName: alert.lab?.name ?? "HQ Alert",
    timestamp: alert.createdAt,
    read: alert.read,
  }));

  const filtered = mapped.filter((alert) => {
    const byRead = parsed.data.read === undefined || alert.read === (parsed.data.read === "true");
    const byType = !parsed.data.type || alert.type === parsed.data.type;
    const bySeverity = !parsed.data.severity || alert.severity === parsed.data.severity;
    return byRead && byType && bySeverity;
  });

  return res.json(filtered);
});

app.patch("/api/alerts/:id/read", async (req, res) => {
  const updated = await prisma.alert.update({
    where: { id: req.params.id },
    data: { read: true },
  });
  return res.json(updated);
});

app.patch("/api/alerts/read-all", async (_req, res) => {
  await prisma.alert.updateMany({ data: { read: true } });
  return res.json({ ok: true });
});

app.get("/api/dashboard", async (_req, res) => {
  const [labs, inventoryRows, equipmentRows, alerts] = await Promise.all([
    prisma.lab.findMany({ include: { inventoryItems: true, equipment: true } }),
    prisma.inventoryItem.findMany(),
    prisma.equipment.findMany(),
    prisma.alert.findMany(),
  ]);

  const mappedLabs = labs.map((lab) => {
    const inventoryCritical = lab.inventoryItems.filter((i) => getInventoryStatus(i.currentStock, i.minThreshold) === "critical").length;
    const inventoryLow = lab.inventoryItems.filter((i) => getInventoryStatus(i.currentStock, i.minThreshold) === "low").length;
    const equipmentCritical = lab.equipment.filter((e) => getEquipmentStatus(e.lastService, e.serviceIntervalDays) === "critical").length;
    const equipmentDue = lab.equipment.filter((e) => getEquipmentStatus(e.lastService, e.serviceIntervalDays) === "due").length;
    const criticalCount = inventoryCritical + equipmentCritical;
    const warningCount = inventoryLow + equipmentDue;
    return criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "operational";
  });

  const inventoryStatuses = inventoryRows.map((item) => getInventoryStatus(item.currentStock, item.minThreshold));
  const equipmentStatuses = equipmentRows.map((eq) => getEquipmentStatus(eq.lastService, eq.serviceIntervalDays));

  return res.json({
    totalLabs: labs.length,
    operationalLabs: mappedLabs.filter((s) => s === "operational").length,
    warningLabs: mappedLabs.filter((s) => s === "warning").length,
    criticalLabs: mappedLabs.filter((s) => s === "critical").length,
    totalInventoryItems: inventoryRows.length,
    lowStockItems: inventoryStatuses.filter((s) => s === "low").length,
    criticalStockItems: inventoryStatuses.filter((s) => s === "critical").length,
    totalEquipment: equipmentRows.length,
    healthyEquipment: equipmentStatuses.filter((s) => s === "healthy").length,
    dueEquipment: equipmentStatuses.filter((s) => s === "due").length,
    criticalEquipment: equipmentStatuses.filter((s) => s === "critical").length,
    unreadAlerts: alerts.filter((a) => !a.read).length,
  });
});

app.listen(port, () => {
  process.stdout.write(`API running on http://localhost:${port}\n`);
});
