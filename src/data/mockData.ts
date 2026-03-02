export interface Lab {
  id: string;
  name: string;
  city: string;
  status: "operational" | "warning" | "critical";
  inventoryAlerts: number;
  equipmentAlerts: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  labId: string;
  labName: string;
  currentStock: number;
  minThreshold: number;
  maxCapacity: number;
  unit: string;
  lastUpdated: string;
  status: "sufficient" | "low" | "critical";
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  labId: string;
  labName: string;
  lastService: string;
  nextService: string;
  status: "healthy" | "due" | "critical";
  serviceInterval: number; // days
  manufacturer: string;
  model: string;
}

export interface Alert {
  id: string;
  type: "inventory" | "equipment";
  severity: "warning" | "critical";
  message: string;
  labName: string;
  timestamp: string;
  read: boolean;
}

const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"];
const labPrefixes = ["Research", "Testing", "Quality", "Production", "Development", "Analysis", "Prototype", "Innovation", "Material", "Advanced"];

export const labs: Lab[] = Array.from({ length: 85 }, (_, i) => {
  const city = cities[i % cities.length];
  const prefix = labPrefixes[i % labPrefixes.length];
  const status = i % 12 === 0 ? "critical" : i % 5 === 0 ? "warning" : "operational";
  return {
    id: `LAB-${String(i + 1).padStart(3, "0")}`,
    name: `${prefix} Lab ${city} ${Math.floor(i / 10) + 1}`,
    city,
    status,
    inventoryAlerts: status === "critical" ? 3 : status === "warning" ? 1 : 0,
    equipmentAlerts: status === "critical" ? 2 : i % 7 === 0 ? 1 : 0,
  };
});

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

export const inventoryItems: InventoryItem[] = [];
labs.slice(0, 20).forEach((lab) => {
  materials.forEach((mat, j) => {
    const maxCap = 50 + Math.floor(Math.random() * 150);
    const minThresh = Math.floor(maxCap * 0.2);
    const current = Math.floor(Math.random() * maxCap);
    const status = current <= minThresh * 0.5 ? "critical" : current <= minThresh ? "low" : "sufficient";
    inventoryItems.push({
      id: `INV-${lab.id}-${j}`,
      name: mat.name,
      category: mat.category,
      labId: lab.id,
      labName: lab.name,
      currentStock: current,
      minThreshold: minThresh,
      maxCapacity: maxCap,
      unit: mat.unit,
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      status,
    });
  });
});

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

export const equipmentList: Equipment[] = [];
labs.slice(0, 20).forEach((lab) => {
  equipmentTypes.forEach((eq, j) => {
    const lastService = new Date(Date.now() - Math.random() * eq.interval * 86400000);
    const nextService = new Date(lastService.getTime() + eq.interval * 86400000);
    const daysUntil = (nextService.getTime() - Date.now()) / 86400000;
    const status = daysUntil < 0 ? "critical" : daysUntil < 14 ? "due" : "healthy";
    equipmentList.push({
      id: `EQ-${lab.id}-${j}`,
      name: eq.name,
      type: eq.type,
      labId: lab.id,
      labName: lab.name,
      lastService: lastService.toISOString(),
      nextService: nextService.toISOString(),
      status,
      serviceInterval: eq.interval,
      manufacturer: eq.manufacturer,
      model: eq.model,
    });
  });
});

export const alerts: Alert[] = [
  { id: "ALT-001", type: "inventory", severity: "critical", message: "PLA Filament critically low (2kg remaining)", labName: "Research Lab Mumbai 1", timestamp: new Date(Date.now() - 1800000).toISOString(), read: false },
  { id: "ALT-002", type: "equipment", severity: "critical", message: "SLA 3D Printer overdue for maintenance by 12 days", labName: "Testing Lab Delhi 1", timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: "ALT-003", type: "inventory", severity: "warning", message: "UV Resin stock below threshold (5L remaining)", labName: "Quality Lab Bangalore 1", timestamp: new Date(Date.now() - 7200000).toISOString(), read: false },
  { id: "ALT-004", type: "equipment", severity: "warning", message: "Laser Cutter maintenance due in 5 days", labName: "Production Lab Chennai 1", timestamp: new Date(Date.now() - 14400000).toISOString(), read: false },
  { id: "ALT-005", type: "inventory", severity: "critical", message: "Carbon Fiber Sheet out of stock", labName: "Development Lab Hyderabad 1", timestamp: new Date(Date.now() - 21600000).toISOString(), read: true },
  { id: "ALT-006", type: "equipment", severity: "critical", message: "CNC Milling Machine showing abnormal vibration", labName: "Research Lab Pune 1", timestamp: new Date(Date.now() - 28800000).toISOString(), read: true },
  { id: "ALT-007", type: "inventory", severity: "warning", message: "Isopropyl Alcohol running low across multiple labs", labName: "HQ Alert", timestamp: new Date(Date.now() - 36000000).toISOString(), read: true },
  { id: "ALT-008", type: "equipment", severity: "warning", message: "Thermal Chamber calibration check needed", labName: "Analysis Lab Kolkata 1", timestamp: new Date(Date.now() - 43200000).toISOString(), read: true },
];

export const dashboardStats = {
  totalLabs: 85,
  operationalLabs: labs.filter(l => l.status === "operational").length,
  warningLabs: labs.filter(l => l.status === "warning").length,
  criticalLabs: labs.filter(l => l.status === "critical").length,
  totalInventoryItems: inventoryItems.length,
  lowStockItems: inventoryItems.filter(i => i.status === "low").length,
  criticalStockItems: inventoryItems.filter(i => i.status === "critical").length,
  totalEquipment: equipmentList.length,
  healthyEquipment: equipmentList.filter(e => e.status === "healthy").length,
  dueEquipment: equipmentList.filter(e => e.status === "due").length,
  criticalEquipment: equipmentList.filter(e => e.status === "critical").length,
  unreadAlerts: alerts.filter(a => !a.read).length,
};
