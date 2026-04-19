"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Printer, PrinterRequest } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PrinterResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

export async function getPrinters(): Promise<Printer[]> {
  return fetchApi<Printer[]>(API_ENDPOINTS.PRINTERS.ALL, {}, z.array(PrinterResponseSchema));
}

export async function getPrinterById(id: string): Promise<Printer> {
  return fetchApi<Printer>(API_ENDPOINTS.PRINTERS.BY_ID(id), {}, PrinterResponseSchema);
}

export async function createPrinter(data: PrinterRequest): Promise<ActionResult<Printer>> {
  try {
    const result = await fetchApi<Printer>(API_ENDPOINTS.PRINTERS.ALL, {
      method: "POST",
      body: JSON.stringify(data),
    }, PrinterResponseSchema);
    revalidatePath("/dashboard/printers");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione della stampante") };
  }
}

export async function updatePrinter(
  id: string,
  data: PrinterRequest
): Promise<ActionResult<Printer>> {
  try {
    const result = await fetchApi<Printer>(API_ENDPOINTS.PRINTERS.BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }, PrinterResponseSchema);
    revalidatePath("/dashboard/printers");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento della stampante") };
  }
}

export async function updatePrinterStatus(
  id: string,
  status: "ONLINE" | "OFFLINE" | "ERROR"
): Promise<Printer> {
  const result = await fetchApi<Printer>(API_ENDPOINTS.PRINTERS.BY_ID(id), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, PrinterResponseSchema);
  revalidatePath("/dashboard/printers");
  return result;
}

export async function deletePrinter(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.PRINTERS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/printers");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione della stampante") };
  }
}
