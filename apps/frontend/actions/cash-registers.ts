"use server";

import { fetchApi } from "@/lib/api";
import {
  API_ENDPOINTS,
  CashRegister,
  CashRegisterRequest,
} from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CashRegisterResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

export async function getCashRegisters(
  include?: string
): Promise<CashRegister[]> {
  const query = include ? `?include=${include}` : "";
  return fetchApi<CashRegister[]>(`${API_ENDPOINTS.CASH_REGISTERS.ALL}${query}`, {}, z.array(CashRegisterResponseSchema));
}

export async function getCashRegisterById(
  id: string
): Promise<CashRegister> {
  return fetchApi<CashRegister>(API_ENDPOINTS.CASH_REGISTERS.BY_ID(id), {}, CashRegisterResponseSchema);
}

export async function createCashRegister(
  data: CashRegisterRequest
): Promise<ActionResult<CashRegister>> {
  try {
    const result = await fetchApi<CashRegister>(
      API_ENDPOINTS.CASH_REGISTERS.ALL,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      CashRegisterResponseSchema
    );
    revalidatePath("/dashboard/cash-registers");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione della cassa") };
  }
}

export async function updateCashRegister(
  id: string,
  data: CashRegisterRequest
): Promise<ActionResult<CashRegister>> {
  try {
    const result = await fetchApi<CashRegister>(
      API_ENDPOINTS.CASH_REGISTERS.BY_ID(id),
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      CashRegisterResponseSchema
    );
    revalidatePath("/dashboard/cash-registers");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento della cassa") };
  }
}

export async function toggleCashRegisterEnabled(
  id: string,
  enabled: boolean
): Promise<ActionResult<CashRegister>> {
  try {
    const result = await fetchApi<CashRegister>(
      API_ENDPOINTS.CASH_REGISTERS.BY_ID(id),
      {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      },
      CashRegisterResponseSchema
    );
    revalidatePath("/dashboard/cash-registers");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento della cassa") };
  }
}

export async function deleteCashRegister(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.CASH_REGISTERS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/cash-registers");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione della cassa") };
  }
}
