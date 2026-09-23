"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-types";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";
import { GetStatsResponseSchema, type GetStatsResponse, type GroupInterval } from "@mysagra/schemas";

export async function getReports(params: {
  from: string;
  to?: string;
  groupBy: GroupInterval;
}): Promise<GetStatsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("from", params.from);
  if (params.to) {
    searchParams.set("to", params.to);
  }
  searchParams.set("groupBy", params.groupBy);

  const endpoint = `${API_ENDPOINTS.REPORTS.ALL}?${searchParams.toString()}`;
  return fetchApi<GetStatsResponse>(endpoint, {}, GetStatsResponseSchema);
}

// Prints the daily closure (07:00 → now) on the default printer of the given cash register
export async function generalClosure(cashRegisterId: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.REPORTS.GENERAL_CLOSURE, {
      method: "POST",
      body: JSON.stringify({ cashRegister: cashRegisterId }),
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore durante la chiusura") };
  }
}
