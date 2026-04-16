"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-types";
import { GetStatsResponseSchema, type GetStatsResponse, type GroupInterval } from "@mysagra/schemas/src/report.schema";

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
