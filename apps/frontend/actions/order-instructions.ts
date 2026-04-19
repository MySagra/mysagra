"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, OrderInstruction } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderInstructionResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

export async function getOrderInstructions(): Promise<OrderInstruction[]> {
  return fetchApi<OrderInstruction[]>(
    API_ENDPOINTS.ORDER_INSTRUCTIONS.ALL,
    {},
    z.array(OrderInstructionResponseSchema)
  );
}

export async function getOrderInstructionById(id: string): Promise<OrderInstruction> {
  return fetchApi<OrderInstruction>(
    API_ENDPOINTS.ORDER_INSTRUCTIONS.BY_ID(id),
    {},
    OrderInstructionResponseSchema
  );
}

export async function createOrderInstruction(data: {
  text: string;
  position?: number;
}): Promise<ActionResult<OrderInstruction>> {
  try {
    const result = await fetchApi<OrderInstruction>(
      API_ENDPOINTS.ORDER_INSTRUCTIONS.ALL,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      OrderInstructionResponseSchema
    );
    revalidatePath("/dashboard/order-instructions");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione dell'istruzione") };
  }
}

export async function updateOrderInstruction(
  id: string,
  data: {
    text?: string;
    position?: number;
  }
): Promise<ActionResult<OrderInstruction>> {
  try {
    const current = await getOrderInstructionById(id);

    const payload = {
      text: data.text ?? current.text,
      position: data.position ?? current.position,
    };

    const result = await fetchApi<OrderInstruction>(
      API_ENDPOINTS.ORDER_INSTRUCTIONS.BY_ID(id),
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      OrderInstructionResponseSchema
    );

    revalidatePath("/dashboard/order-instructions");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento dell'istruzione") };
  }
}

export async function reorderOrderInstructions(
  items: { id: string; text: string; position: number }[]
): Promise<OrderInstruction[]> {
  const results: OrderInstruction[] = [];
  for (const { id, text, position } of items) {
    const result = await fetchApi<OrderInstruction>(
      API_ENDPOINTS.ORDER_INSTRUCTIONS.BY_ID(id),
      {
        method: "PUT",
        body: JSON.stringify({ text, position }),
      },
      OrderInstructionResponseSchema
    );
    results.push(result);
  }
  revalidatePath("/dashboard/order-instructions");
  return results;
}

export async function deleteOrderInstruction(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.ORDER_INSTRUCTIONS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/order-instructions");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione dell'istruzione") };
  }
}
