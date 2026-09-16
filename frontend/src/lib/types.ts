export type Role = "USER" | "ADMIN";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
}

export interface Branch {
  _id: string;
  name: string;
  location: { lat: number; lng: number; address: string };
  isActive: boolean;
  currentLoad: number;
  maxCapacity: number;
}

export interface OrderItemInput {
  product: string; // product id
  quantity: number;
}

export type OrderStatus =
  | "pending"
  | "allocated"
  | "processing"
  | "shipped"
  | "cancelled"
  | "unfulfillable";

export interface Order {
  _id: string;
  status: OrderStatus;
  branch: { _id: string; name: string } | null;
  items: Array<{
    product: { _id: string; name: string; sku: string } | string;
    quantity: number;
    priceAtOrder: number;
  }>;
  deliveryLocation: { lat: number; lng: number; address: string };
  note: string;
  classification?: {
    category: string | null;
    confidence: number | null;
    isUncertain: boolean;
  };
  createdAt: string;
}
