"use server";

import { fetchApi } from "@/lib/api";
import {
  API_ENDPOINTS,
  CashRegister,
  CashRegisterRequest,
} from "@/lib/api-types";
import { revalidatePath } from "next/cache";

export async function getCashRegisters(
  include?: string
): Promise<CashRegister[]> {
  const query = include ? `?include=${include}` : "";
  return fetchApi<CashRegister[]>(`${API_ENDPOINTS.CASH_REGISTERS.ALL}${query}`);
}

export async function getCashRegisterById(
  id: string
): Promise<CashRegister> {
  return fetchApi<CashRegister>(API_ENDPOINTS.CASH_REGISTERS.BY_ID(id));
}

export async function createCashRegister(
  data: CashRegisterRequest
): Promise<CashRegister> {
  const result = await fetchApi<CashRegister>(
    API_ENDPOINTS.CASH_REGISTERS.ALL,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  revalidatePath("/dashboard/cash-registers");
  return result;
}

export async function updateCashRegister(
  id: string,
  data: CashRegisterRequest
): Promise<CashRegister> {
  const result = await fetchApi<CashRegister>(
    API_ENDPOINTS.CASH_REGISTERS.BY_ID(id),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  revalidatePath("/dashboard/cash-registers");
  return result;
}

export async function toggleCashRegisterEnabled(
  id: string,
  enabled: boolean
): Promise<CashRegister> {
  const result = await fetchApi<CashRegister>(
    API_ENDPOINTS.CASH_REGISTERS.BY_ID(id),
    {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }
  );
  revalidatePath("/dashboard/cash-registers");
  return result;
}

export async function deleteCashRegister(id: string): Promise<void> {
  await fetchApi(API_ENDPOINTS.CASH_REGISTERS.BY_ID(id), {
    method: "DELETE",
  });
  revalidatePath("/dashboard/cash-registers");
}
