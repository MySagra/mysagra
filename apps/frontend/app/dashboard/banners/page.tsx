import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { BannersContent } from "@/components/dashboard/banners/banners-content";
import { getBanners } from "@/actions/banners";
import { Banner } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function BannersPage() {
  let banners: Banner[] = [];

  try {
    banners = await getBanners();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    banners = [];
  }

  return (
    <>
      <DashboardHeader title="Banner" />
      <BannersContent initialBanners={banners} />
    </>
  );
}
