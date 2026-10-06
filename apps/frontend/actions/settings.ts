"use server";

import type { SettingsData, UpdateSettings } from "@mysagra/schemas";
import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

// SettingsResponse as received over JSON: dates are strings
export type SagraSettings = {
  sagra: { name: string; receiptLogo: string | null };
  settings: SettingsData;
  updatedAt: string | null;
};

export async function getSettings(): Promise<SagraSettings> {
  return fetchApi<SagraSettings>(API_ENDPOINTS.SETTINGS);
}

export async function updateSettings(data: UpdateSettings): Promise<ActionResult<SagraSettings>> {
  try {
    const result = await fetchApi<SagraSettings>(API_ENDPOINTS.SETTINGS, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    // the dashboard layout provides the settings to every page
    revalidatePath("/dashboard", "layout");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nel salvataggio delle impostazioni") };
  }
}
