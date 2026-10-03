"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocale } from "@/contexts/locale-context";
import { Translations } from "@/lib/i18n";
import type { ReactNode } from "react";

interface DashboardHeaderProps {
  navKey: keyof Translations["nav"];
  parentHref?: string;
  /** Shown right after the breadcrumb (e.g. the page tabs) */
  tabs?: ReactNode;
  /** Right-aligned header actions */
  actions?: ReactNode;
}

export function DashboardHeader({
  navKey,
  parentHref = "/dashboard",
  tabs,
  actions,
}: DashboardHeaderProps) {
  const { t } = useLocale();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        {/* On phones the tabs already say where you are */}
        <Breadcrumb className={tabs ? "max-sm:hidden" : undefined}>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={parentHref}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{t.nav[navKey]}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {tabs && <div className="sm:ml-4">{tabs}</div>}
      </div>
      {actions && <div className="ml-auto flex items-center gap-2 px-4">{actions}</div>}
    </header>
  );
}
