import { getOrders } from "@/actions/orders";
import { getSettings } from "@/actions/settings";
import { SettingsDataSchema } from "@mysagra/schemas";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OrdersContent } from "@/components/dashboard/orders/orders-content";
import { parsePageState, pageStateToQuery } from "@/components/dashboard/orders/advanced-filters";
import { PaginatedOrders } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Search/filters live in the URL: a reload sends the same GET to the backend
  const pageState = parsePageState(await searchParams);

  let ordersData: PaginatedOrders = {
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
    },
  };

  try {
    // "today"/date ranges are resolved in the sagra time zone
    const timeZone = await getSettings()
      .then((r) => r.settings.general.timezone)
      .catch((error) => {
        if (isRedirectError(error)) throw error;
        return SettingsDataSchema.parse({}).general.timezone;
      });
    ordersData = await getOrders({ ...pageStateToQuery(pageState, timeZone), page: pageState.page, limit: 20 });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    // fallback to empty
  }

  return (
    <>
      <DashboardHeader navKey="orders" />
      <OrdersContent initialData={ordersData} initialState={pageState} />
    </>
  );
}
