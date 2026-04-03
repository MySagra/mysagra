"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Banner } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BannerResponseSchema } from "@mysagra/schemas";

export async function getBanners(): Promise<Banner[]> {
  return fetchApi<Banner[]>(API_ENDPOINTS.BANNERS.ALL, {}, z.array(BannerResponseSchema));
}

export async function getBannerById(id: string): Promise<Banner> {
  return fetchApi<Banner>(API_ENDPOINTS.BANNERS.BY_ID(id), {}, BannerResponseSchema);
}

export async function createBanner(data: {
  label: string;
  type: string;
  title?: string | null;
  description?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  color?: string;
  dateTime?: string | null;
}): Promise<Banner> {
  const result = await fetchApi<Banner>(API_ENDPOINTS.BANNERS.ALL, {
    method: "POST",
    body: JSON.stringify(data),
  }, BannerResponseSchema);
  revalidatePath("/dashboard/banners");
  return result;
}

export async function updateBanner(
  id: string,
  data: {
    label: string;
    type: string;
    title?: string | null;
    description?: string | null;
    website?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    color?: string;
    dateTime?: string | null;
  }
): Promise<Banner> {
  const result = await fetchApi<Banner>(API_ENDPOINTS.BANNERS.BY_ID(id), {
    method: "PUT",
    body: JSON.stringify(data),
  }, BannerResponseSchema);
  revalidatePath("/dashboard/banners");
  return result;
}

export async function deleteBanner(id: string): Promise<void> {
  await fetchApi(API_ENDPOINTS.BANNERS.BY_ID(id), {
    method: "DELETE",
  });
  revalidatePath("/dashboard/banners");
}

export async function uploadBannerImage(id: string, formData: FormData): Promise<void> {
  await fetchApi(API_ENDPOINTS.BANNERS.IMAGE(id), {
    method: "PATCH",
    body: formData,
  });
  revalidatePath("/dashboard/banners");
}
