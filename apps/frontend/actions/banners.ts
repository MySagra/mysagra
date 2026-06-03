"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Banner } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BannerResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

export async function getBanners(): Promise<Banner[]> {
  return fetchApi<Banner[]>(API_ENDPOINTS.BANNERS.ALL, {}, z.array(BannerResponseSchema));
}

export async function getBannerById(id: string): Promise<Banner> {
  return fetchApi<Banner>(API_ENDPOINTS.BANNERS.BY_ID(id), {}, BannerResponseSchema);
}

export async function reorderBanners(
  banners: { id: string; label: string; type: string; position: number; title?: string | null; description?: string | null; website?: string | null; facebook?: string | null; instagram?: string | null; telephone?: string | null; color?: string; startsAt?: string | null; endsAt?: string | null }[]
): Promise<Banner[]> {
  const results: Banner[] = [];
  for (const banner of banners) {
    const result = await fetchApi<Banner>(
      API_ENDPOINTS.BANNERS.BY_ID(banner.id),
      {
        method: "PUT",
        body: JSON.stringify(banner),
      },
      BannerResponseSchema
    );
    results.push(result);
  }
  revalidatePath("/dashboard/banners");
  return results;
}

export async function createBanner(data: {
  label: string;
  type: string;
  position: number;
  title?: string | null;
  description?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  telephone?: string | null;
  color?: string;
  startsAt?: string | null;
  endsAt?: string | null;
}): Promise<ActionResult<Banner>> {
  try {
    const result = await fetchApi<Banner>(API_ENDPOINTS.BANNERS.ALL, {
      method: "POST",
      body: JSON.stringify(data),
    }, BannerResponseSchema);
    revalidatePath("/dashboard/banners");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione del banner") };
  }
}

export async function updateBanner(
  id: string,
  data: {
    label: string;
    type: string;
    position: number;
    title?: string | null;
    description?: string | null;
    website?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    telephone?: string | null;
    color?: string;
    startsAt?: string | null;
    endsAt?: string | null;
  }
): Promise<ActionResult<Banner>> {
  try {
    const result = await fetchApi<Banner>(API_ENDPOINTS.BANNERS.BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }, BannerResponseSchema);
    revalidatePath("/dashboard/banners");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento del banner") };
  }
}

export async function deleteBanner(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.BANNERS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/banners");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione del banner") };
  }
}

export async function uploadBannerImage(id: string, formData: FormData): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.BANNERS.IMAGE(id), {
      method: "PATCH",
      body: formData,
    });
    revalidatePath("/dashboard/banners");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nel caricamento dell'immagine") };
  }
}
