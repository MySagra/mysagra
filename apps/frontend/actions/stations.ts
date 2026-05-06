"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Station } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { StationResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

export async function getStations(): Promise<Station[]> {
  return fetchApi<Station[]>(
    `${API_ENDPOINTS.STATIONS.ALL}?include=categories`,
    {},
    z.array(StationResponseSchema)
  );
}

export async function getStationById(id: string): Promise<Station> {
  return fetchApi<Station>(API_ENDPOINTS.STATIONS.BY_ID(id), {}, StationResponseSchema);
}

export async function createStation(data: {
  name: string;
}): Promise<ActionResult<Station>> {
  try {
    const result = await fetchApi<Station>(API_ENDPOINTS.STATIONS.ALL, {
      method: "POST",
      body: JSON.stringify(data),
    }, StationResponseSchema);
    revalidatePath("/dashboard/stations");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione della postazione") };
  }
}

export async function updateStation(
  id: string,
  data: {
    name: string;
  }
): Promise<ActionResult<Station>> {
  try {
    const result = await fetchApi<Station>(API_ENDPOINTS.STATIONS.BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }, StationResponseSchema);
    revalidatePath("/dashboard/stations");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento della postazione") };
  }
}

export async function deleteStation(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.STATIONS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/stations");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione della postazione") };
  }
}

export async function checkStationNameExists(name: string, excludeId?: string): Promise<boolean> {
  try {
    const stations = await getStations();
    return stations.some(s => s.name.toLowerCase() === name.toLowerCase() && s.id !== excludeId);
  } catch {
    return false;
  }
}
