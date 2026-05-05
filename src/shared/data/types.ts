export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  contactPerson: string;
  license: string;
  createdAt: string;
  isActive: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  activeIngredient: string;
  form: string;
  dosage: string;
  unit: string;
  category: string;
  isPOS: boolean;
  lastSynced?: string;
}

export interface Wholesaler {
  id: string;
  name: string;
  rating: number;
}

export interface WholesalerPrice {
  wholesalerId: string;
  wholesalerName: string;
  medicineId: string;
  price: number;
  inStock: boolean;
  minOrder: number;
  deliveryDays: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  wholesalerId: string;
  wholesalerName: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  pharmacyId: string;
  pharmacyName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface CartItem {
  medicine: Medicine;
  wholesalerId: string;
  wholesalerName: string;
  quantity: number;
  unitPrice: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  notificationPrefs: {
    orderUpdates: boolean;
    priceChanges: boolean;
    stockAlerts: boolean;
    emailDigest: boolean;
  };
  posIntegration: {
    enabled: boolean;
    provider: string;
    lastSync: string;
    status: "connected" | "disconnected" | "error";
  };
}
