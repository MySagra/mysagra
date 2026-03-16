"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Printer, PrinterRequest } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PrinterResponseSchema } from "@mysagra/schemas";

export async function getPrinters(): Promise<Printer[]> {
  return fetchApi<Printer[]>(API_ENDPOINTS.PRINTERS.ALL, {}, z.array(PrinterResponseSchema));
}

export async function getPrinterById(id: string): Promise<Printer> {
  return fetchApi<Printer>(API_ENDPOINTS.PRINTERS.BY_ID(id), {}, PrinterResponseSchema);
}

export async function createPrinter(data: PrinterRequest): Promise<Printer> {
  const result = await fetchApi<Printer>(API_ENDPOINTS.PRINTERS.ALL, {
    method: "POST",
    body: JSON.stringify(data),
  }, PrinterResponseSchema);
  revalidatePath("/dashboard/printers");
  return result;
}

export async function updatePrinter(
  id: string,
  data: PrinterRequest
): Promise<Printer> {
  const result = await fetchApi<Printer>(API_ENDPOINTS.PRINTERS.BY_ID(id), {
    method: "PUT",
    body: JSON.stringify(data),
  }, PrinterResponseSchema);
  revalidatePath("/dashboard/printers");
  return result;
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

export async function deletePrinter(id: string): Promise<void> {
  await fetchApi(API_ENDPOINTS.PRINTERS.BY_ID(id), {
    method: "DELETE",
  });
  revalidatePath("/dashboard/printers");
}
