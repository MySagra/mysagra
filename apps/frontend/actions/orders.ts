"use server";

import { fetchApi } from "@/lib/api";
import {
  API_ENDPOINTS,
  PaginatedOrders,
  OrderDetailResponse,
  OrderStatus,
} from "@/lib/api-types";
import { revalidatePath } from "next/cache";

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
  return fetchApi<PaginatedOrders>(endpoint);
}

export async function getOrderById(id: number): Promise<OrderDetailResponse> {
  return fetchApi<OrderDetailResponse>(API_ENDPOINTS.ORDERS.BY_ID(id));
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<void> {
  await fetchApi(API_ENDPOINTS.ORDERS.BY_ID(id), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath("/dashboard/orders");
}

export async function deleteOrder(id: number): Promise<void> {
  await fetchApi(API_ENDPOINTS.ORDERS.BY_ID(id), {
    method: "DELETE",
  });
  revalidatePath("/dashboard/orders");
}
