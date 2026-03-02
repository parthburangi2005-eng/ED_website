export interface DashboardStats {
  totalLabs: number;
  operationalLabs: number;
  warningLabs: number;
  criticalLabs: number;
  totalInventoryItems: number;
  lowStockItems: number;
  criticalStockItems: number;
  totalEquipment: number;
  healthyEquipment: number;
  dueEquipment: number;
  criticalEquipment: number;
  unreadAlerts: number;
}

export interface Lab {
  id: string;
  code: string;
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
  serviceInterval: number;
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
