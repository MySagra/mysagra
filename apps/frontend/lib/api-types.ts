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

// Stations
export interface Station {
  id: string;
  name: string;
  categories?: Category[];
}

export interface StationRequest {
  name: string;
}

// Categories
export interface Category {
  id: string;
  name: string;
  available: boolean;
  position: number;
  printerId?: string | null;
  image?: string | null;
  stationId?: string | null;
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
export type OrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "PICKED_UP" | "CANCELLED" | "PARTIAL";
export type PaymentMethod = "CASH" | "CARD";

export interface OrderListResponse {
  id: string;
  displayCode: string;
  table: string;
  customer: string;
  subTotal: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderStationState {
  id: string;
  status: string;
  orderId: string;
  stationId: string;
}

export interface OrderDetailResponse {
  id: string;
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
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  categorizedItems: CategorizedItems[];
  orderStationStates?: OrderStationState[];
}

export interface CategorizedItems {
  category: {
    id: string;
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
  ip?: string | null;
  mac?: string | null;
  port: number;
  description?: string;
  status: "ONLINE" | "OFFLINE" | "ERROR";
}

export interface PrinterRequest {
  name: string;
  ip?: string | null;
  mac?: string | null;
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

// API Keys
export type ApiKeyType = "PRINTER" | "WEBAPP";
export type ApiKeyPrefix = "ms_pt_" | "ms_wb_";

export interface ApiKey {
  id: string;
  last_digits: string;
  type: ApiKeyType;
  prefix: ApiKeyPrefix;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export interface CreateApiKeyRequest {
  name: string;
  type: ApiKeyType;
}

export interface CreateApiKeyResponse {
  id: string;
  type: ApiKeyType;
  apiKey: string;
  createdAt: string;
}

// Banners
export type BannerType = "EVENT" | "SPONSOR";

export interface Banner {
  id: string;
  label: string;
  type: BannerType;
  title?: string | null;
  description?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  color?: string;
  dateTime?: Date | string | null;
  image: string | null;
}

// Order Instructions
export interface OrderInstruction {
  id: string;
  text: string;
  position: number;
}

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
  },
  STATIONS: {
    ALL: "/v1/stations",
    BY_ID: (id: string) => `/v1/stations/${id}`,
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
    BY_ID: (id: string) => `/v1/orders/${id}`,
    CONFIRM: (id: string) => `/v1/orders/${id}/confirm`,
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
  API_KEYS: {
    ALL: "/v1/api-keys",
    BY_ID: (id: string) => `/v1/api-keys/${id}`,
  },
  BANNERS: {
    ALL: "/v1/banners",
    BY_ID: (id: string) => `/v1/banners/${id}`,
    IMAGE: (id: string) => `/v1/banners/${id}/image`,
  },
  ORDER_INSTRUCTIONS: {
    ALL: "/v1/order-instructions",
    BY_ID: (id: string) => `/v1/order-instructions/${id}`,
  },
  REPORTS: {
    ALL: "/v1/reports",
  },
} as const;
