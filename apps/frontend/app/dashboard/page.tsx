"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  UtensilsCrossed,
  ChefHat,
  Leaf,
  Printer,
  Users,
  Landmark,
  ShoppingBag,
  ImageIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useSession } from "next-auth/react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useLocale } from "@/contexts/locale-context";
import { useRole } from "@/hooks/use-role";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useLocale();
  const { canManageUsers, canManageCategories, canManageBanners } = useRole();

  const navigationCards = [
    ...(canManageCategories
      ? [{
          title: t.dashboard.cardCategoriesTitle,
          description: t.dashboard.cardCategoriesDescription,
          icon: ChefHat,
          href: "/dashboard/categories",
          color: "text-orange-600",
          bgColor: "bg-orange-50 dark:bg-orange-950/20",
        }]
      : []),
    {
      title: t.dashboard.cardFoodsTitle,
      description: t.dashboard.cardFoodsDescription,
      icon: UtensilsCrossed,
      href: "/dashboard/foods",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: t.dashboard.cardIngredientsTitle,
      description: t.dashboard.cardIngredientsDescription,
      icon: Leaf,
      href: "/dashboard/ingredients",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: t.dashboard.cardPrintersTitle,
      description: t.dashboard.cardPrintersDescription,
      icon: Printer,
      href: "/dashboard/printers",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    ...(canManageUsers
      ? [{
          title: t.dashboard.cardUsersTitle,
          description: t.dashboard.cardUsersDescription,
          icon: Users,
          href: "/dashboard/users",
          color: "text-purple-600",
          bgColor: "bg-purple-50 dark:bg-purple-950/20",
        }]
      : []),
    {
      title: t.dashboard.cardCashRegistersTitle,
      description: t.dashboard.cardCashRegistersDescription,
      icon: Landmark,
      href: "/dashboard/cash-registers",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      title: t.dashboard.cardOrdersTitle,
      description: t.dashboard.cardOrdersDescription,
      icon: ShoppingBag,
      href: "/dashboard/orders",
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
    },
    ...(canManageBanners
      ? [{
          title: t.dashboard.cardBannersTitle,
          description: t.dashboard.cardBannersDescription,
          icon: ImageIcon,
          href: "/dashboard/banners",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
        }]
      : []),
  ];

  const formatName = (name: string | null | undefined) => {
    if (!name) return t.dashboard.defaultUser;
    const lowerName = name.toLowerCase();
    return lowerName.charAt(0).toUpperCase() + lowerName.slice(1);
  };

  const userName = formatName(session?.user?.name);

  return (
    <><DashboardHeader title={t.nav.home} /><div className="space-y-6 p-4 md:p-8">
      {/* Welcome Section */}
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <Logo width={56} height={56} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            {t.dashboard.welcomeTitle} {userName}!
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t.dashboard.welcomeSubtitle}
          </p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t.dashboard.sectionsTitle}</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-3 sm:p-4">
                    <div
                      className={`w-9 h-9 rounded-lg ${card.bgColor} flex items-center justify-center mb-2`}
                    >
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                    </div>
                    <p className="font-semibold text-sm leading-tight">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div></>
  );
}
