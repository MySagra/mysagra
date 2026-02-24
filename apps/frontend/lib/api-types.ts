// API Types for MyAmministratore

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    role: string;
  };
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ErrorResponse {
  message: string;
}

// Users & Roles
export interface User {
  id: string;
  username: string;
  roleId: string;
  role: {
    id: string;
    name: string;
  };
}

export interface UserRequest {
  username: string;
  password: string;
  roleId: string;
}

export interface Role {
  id: string;
  name: string;
}

// Categories
export interface Category {
  id: string;
  name: string;
  available: boolean;
  position: number;
  printerId?: string | null;
}

export interface CategoryWithFoods extends Category {
  foods: Food[];
}

// Foods
export interface Food {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  printerId?: string | null;
  available: boolean;
  category?: {
    id: string;
    name: string;
    available: boolean;
    position: number;
  };
  ingredients?: Ingredient[];
}

export interface FoodRequest {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  printerId?: string | null;
  available: boolean;
  ingredients?: { id: string }[];
}

// Ingredients
export interface Ingredient {
  id: string;
  name: string;
}

// Orders
export type OrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "PICKED_UP";
export type PaymentMethod = "CASH" | "CARD";

export interface OrderListResponse {
  id: string;
  displayCode: string;
  table: string;
  customer: string;
  subTotal: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetailResponse {
  id: number;
  displayCode: string;
  table: string;
  customer: string;
  subTotal: string;
  total?: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod | null;
  discount?: number;
  surcharge?: number;
  ticketNumber?: number | null;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  categorizedItems: CategorizedItems[];
}

export interface CategorizedItems {
  category: {
    id: number;
    name: string;
  };
  items: OrderItemDetailed[];
}

export interface OrderItemDetailed {
  id: string;
  quantity: number;
  notes?: string;
  unitPrice: number;
  unitSurcharge: number;
  total: number;
  food: FoodWithIngredients;
}

export interface FoodWithIngredients {
  id: string;
  name: string;
  description?: string;
  price: string;
  available: boolean;
  ingredients?: Ingredient[];
}

export interface PaginatedOrders {
  data: OrderListResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

// Printers
export interface Printer {
  id: string;
  name: string;
  ip: string;
  port: number;
  description?: string;
  status: "ONLINE" | "OFFLINE" | "ERROR";
}

export interface PrinterRequest {
  name: string;
  ip: string;
  port: number;
  description?: string;
  status?: "ONLINE" | "OFFLINE" | "ERROR";
}

// Cash Registers
export interface CashRegister {
  id: string;
  name: string;
  enabled: boolean;
  defaultPrinterId: string;
  defaultPrinter?: Printer;
}

export interface CashRegisterRequest {
  name: string;
  enabled: boolean;
  defaultPrinterId: string;
}

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
  },
  CATEGORIES: {
    ALL: "/v1/categories",
    BY_ID: (id: string) => `/v1/categories/${id}`,
    IMAGE: (id: string) => `/v1/categories/${id}/image`,
  },
  FOODS: {
    ALL: "/v1/foods",
    BY_ID: (id: string) => `/v1/foods/${id}`,
  },
  INGREDIENTS: {
    ALL: "/v1/ingredients",
    BY_ID: (id: string) => `/v1/ingredients/${id}`,
  },
  ORDERS: {
    ALL: "/v1/orders",
    BY_ID: (id: number) => `/v1/orders/${id}`,
    CONFIRM: (id: number) => `/v1/orders/${id}/confirm`,
  },
  PRINTERS: {
    ALL: "/v1/printers",
    BY_ID: (id: string) => `/v1/printers/${id}`,
  },
  CASH_REGISTERS: {
    ALL: "/v1/cash-registers",
    BY_ID: (id: string) => `/v1/cash-registers/${id}`,
  },
  USERS: {
    ALL: "/v1/users",
    BY_ID: (id: string) => `/v1/users/${id}`,
  },
  ROLES: {
    ALL: "/v1/roles",
    BY_ID: (id: string) => `/v1/roles/${id}`,
  },
} as const;
