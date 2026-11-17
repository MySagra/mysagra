"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Display, DisplayRequest } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DisplayResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

export async function getDisplays(): Promise<Display[]> {
  return fetchApi<Display[]>(API_ENDPOINTS.DISPLAYS.ALL, {}, z.array(DisplayResponseSchema));
}

export async function createDisplay(
  data: DisplayRequest
): Promise<ActionResult<Display>> {
  try {
    const result = await fetchApi<Display>(
      API_ENDPOINTS.DISPLAYS.ALL,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      DisplayResponseSchema
    );
    revalidatePath("/dashboard/displays");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione del display") };
  }
}

export async function updateDisplay(
  id: string,
  data: DisplayRequest
): Promise<ActionResult<Display>> {
  try {
    const result = await fetchApi<Display>(
      API_ENDPOINTS.DISPLAYS.BY_ID(id),
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      DisplayResponseSchema
    );
    revalidatePath("/dashboard/displays");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento del display") };
  }
}

export async function deleteDisplay(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.DISPLAYS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/displays");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione del display") };
  }
}
