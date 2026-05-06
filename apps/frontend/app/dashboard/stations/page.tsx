import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StationsContent } from "@/components/dashboard/stations/stations-content";
import { getStations } from "@/actions/stations";
import { Station } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function StationsPage() {
  let stations: Station[] = [];

  try {
    stations = await getStations();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    stations = [];
  }

  return (
    <>
      <DashboardHeader title="Postazioni" />
      <StationsContent initialStations={stations} />
    </>
  );
}
