import { CustomerAppContent } from "@/components/dashboard/customer-app/customer-app-content";
import {
  toPreviewCategories,
  type CustomerAppTab,
} from "@/components/dashboard/customer-app/customer-app-utils";
import { getBanners } from "@/actions/banners";
import { getOrderInstructions } from "@/actions/order-instructions";
import { getCategories } from "@/actions/categories";
import { Banner, Category, OrderInstruction } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

// each source fails on its own: a broken one doesn't hide the other tab
async function load<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return fallback;
  }
}

export default async function CustomerAppPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab: CustomerAppTab = tab === "instructions" ? "instructions" : "banners";

  const [banners, instructions, categories] = await Promise.all([
    load<Banner[]>(getBanners, []),
    load<OrderInstruction[]>(getOrderInstructions, []),
    load<Category[]>(getCategories, []),
  ]);

  return (
    <CustomerAppContent
      initialTab={initialTab}
      initialBanners={banners}
      initialInstructions={instructions}
      categories={toPreviewCategories(categories)}
    />
  );
}
