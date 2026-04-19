"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Category } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CategoryResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

export async function getCategories(): Promise<Category[]> {
  return fetchApi<Category[]>(API_ENDPOINTS.CATEGORIES.ALL, {}, z.array(CategoryResponseSchema));
}

export async function getCategoryById(id: string): Promise<Category> {
  return fetchApi<Category>(API_ENDPOINTS.CATEGORIES.BY_ID(id), {}, CategoryResponseSchema);
}

export async function createCategory(data: {
  name: string;
  available: boolean;
  position?: number;
  printerId?: string | null;
}): Promise<ActionResult<Category>> {
  try {
    const result = await fetchApi<Category>(API_ENDPOINTS.CATEGORIES.ALL, {
      method: "POST",
      body: JSON.stringify(data),
    }, CategoryResponseSchema);
    revalidatePath("/dashboard/categories");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione della categoria") };
  }
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    available?: boolean;
    position?: number;
    printerId?: string | null;
  }
): Promise<ActionResult<Category>> {
  try {
    // First fetch the current category to ensure we have all fields for the PUT request
    const currentCategory = await getCategoryById(id);

    // Merge current data with updates
    const payload = {
      name: data.name ?? currentCategory.name,
      available: data.available ?? currentCategory.available,
      position: data.position ?? currentCategory.position,
      printerId: data.printerId !== undefined ? data.printerId : (currentCategory.printerId || undefined),
    };

    const result = await fetchApi<Category>(API_ENDPOINTS.CATEGORIES.BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }, CategoryResponseSchema);

    revalidatePath("/dashboard/categories");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento della categoria") };
  }
}

export async function reorderCategories(
  categories: { id: string; name: string; available: boolean; position: number; printerId?: string | null }[]
): Promise<Category[]> {
  const results: Category[] = [];
  for (const { id, name, available, position, printerId } of categories) {
    const result = await fetchApi<Category>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id),
      {
        method: "PUT",
        body: JSON.stringify({ name, available, position, printerId: printerId ?? undefined }),
      },
      CategoryResponseSchema
    );
    results.push(result);
  }
  revalidatePath("/dashboard/categories");
  return results;
}

export async function toggleCategoryAvailability(
  id: string,
  available: boolean
): Promise<Category> {
  const result = await fetchApi<Category>(API_ENDPOINTS.CATEGORIES.BY_ID(id), {
    method: "PATCH",
    body: JSON.stringify({ available }),
  }, CategoryResponseSchema);
  revalidatePath("/dashboard/categories");
  return result;
}

export async function deleteCategory(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.CATEGORIES.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/categories");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione della categoria") };
  }
}

export async function uploadCategoryImage(id: string, formData: FormData): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.CATEGORIES.IMAGE(id), {
      method: "PATCH",
      body: formData,
    });
    revalidatePath("/dashboard/categories");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nel caricamento dell'immagine") };
  }
}

export async function checkCategoryNameExists(name: string, excludeId?: string): Promise<boolean> {
  try {
    const categories = await getCategories();
    return categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== excludeId);
  } catch {
    return false;
  }
}
