"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, OrderInstruction } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderInstructionResponseSchema } from "@mysagra/schemas";

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
}): Promise<OrderInstruction> {
  const result = await fetchApi<OrderInstruction>(
    API_ENDPOINTS.ORDER_INSTRUCTIONS.ALL,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    OrderInstructionResponseSchema
  );
  revalidatePath("/dashboard/order-instructions");
  return result;
}

export async function updateOrderInstruction(
  id: string,
  data: {
    text?: string;
    position?: number;
  }
): Promise<OrderInstruction> {
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
  return result;
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

export async function deleteOrderInstruction(id: string): Promise<void> {
  await fetchApi(API_ENDPOINTS.ORDER_INSTRUCTIONS.BY_ID(id), {
    method: "DELETE",
  });
  revalidatePath("/dashboard/order-instructions");
}
