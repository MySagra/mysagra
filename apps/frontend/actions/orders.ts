"use server";

import { fetchApi } from "@/lib/api";
import {
  API_ENDPOINTS,
  PaginatedOrders,
  OrderDetailResponse,
  OrderStatus,
} from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

const OrderStatusSchema = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "PICKED_UP"]);

// Frontend-specific schemas matching the actual API response shapes
const OrderListItemSchema = z.object({
  id: z.coerce.string(),
  displayCode: z.string(),
  table: z.string(),
  customer: z.string(),
  subTotal: z.coerce.string(),
  status: OrderStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().optional(),
}).passthrough();

const PaginatedOrdersSchema = z.object({
  data: z.array(OrderListItemSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalItems: z.number(),
  }),
}) as unknown as z.ZodType<PaginatedOrders>;

const OrderDetailSchema = z.object({
  id: z.coerce.string(),
  displayCode: z.string(),
  table: z.string(),
  customer: z.string(),
  subTotal: z.coerce.string(),
  total: z.coerce.string().optional(),
  status: OrderStatusSchema,
  paymentMethod: z.enum(["CASH", "CARD"]).nullish(),
  discount: z.coerce.number().optional(),
  surcharge: z.coerce.number().optional(),
  ticketNumber: z.number().int().nullish(),
  confirmedAt: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  categorizedItems: z.array(z.any()).optional(),
}).passthrough() as unknown as z.ZodType<OrderDetailResponse>;

export async function getOrders(params?: {
  search?: string;
  displayCode?: string;
  page?: number;
  limit?: number;
  status?: OrderStatus[];
  dateFrom?: string;
  dateTo?: string;
}): Promise<PaginatedOrders> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.displayCode)
    searchParams.set("displayCode", params.displayCode);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.status) {
    params.status.forEach((s) => searchParams.append("status", s));
  }
  if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params?.dateTo) searchParams.set("dateTo", params.dateTo);

  const query = searchParams.toString();
  const endpoint = `${API_ENDPOINTS.ORDERS.ALL}${query ? `?${query}` : ""}`;
  return fetchApi<PaginatedOrders>(endpoint, {}, PaginatedOrdersSchema);
}

export async function getOrderById(id: string): Promise<OrderDetailResponse> {
  return fetchApi<OrderDetailResponse>(API_ENDPOINTS.ORDERS.BY_ID(id), {}, OrderDetailSchema);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  await fetchApi(API_ENDPOINTS.ORDERS.BY_ID(id), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath("/dashboard/orders");
}

export async function reprintOrder(
  id: string,
  params: { orderItems?: string[]; reprintReceipt: boolean }
): Promise<ActionResult<void>> {
  try {
    await fetchApi(
      `${API_ENDPOINTS.ORDERS.BY_ID(id)}/reprint`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore durante la ristampa") };
  }
}

export async function deleteOrder(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.ORDERS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/orders");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione dell'ordine") };
  }
}
