import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OrderInstructionsContent } from "@/components/dashboard/order-instructions/order-instructions-content";
import { getOrderInstructions } from "@/actions/order-instructions";
import { OrderInstruction } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function OrderInstructionsPage() {
  let instructions: OrderInstruction[] = [];

  try {
    instructions = await getOrderInstructions();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    instructions = [];
  }

  return (
    <>
      <DashboardHeader title="Istruzioni Ordine" />
      <OrderInstructionsContent initialInstructions={instructions} />
    </>
  );
}
