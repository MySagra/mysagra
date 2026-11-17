import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DisplaysContent } from "@/components/dashboard/displays/displays-content";
import { getDisplays } from "@/actions/displays";
import { getStations } from "@/actions/stations";
import { Display, Station } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function DisplaysPage() {
  let displays: Display[] = [];
  let stations: Station[] = [];

  try {
    [displays, stations] = await Promise.all([getDisplays(), getStations()]);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    displays = [];
    stations = [];
  }

  return (
    <>
      <DashboardHeader navKey="displays" />
      <DisplaysContent initialDisplays={displays} stations={stations} />
    </>
  );
}
