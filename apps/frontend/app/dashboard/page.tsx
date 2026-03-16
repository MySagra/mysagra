"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UtensilsCrossed,
  ChefHat,
  Leaf,
  Printer,
  Users,
  Landmark,
  ShoppingBag,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useSession } from "next-auth/react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useLocale } from "@/contexts/locale-context";
import { useRole } from "@/hooks/use-role";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useLocale();
  const { canManageUsers, canManageCategories } = useRole();

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
  ];

  const formatName = (name: string | null | undefined) => {
    if (!name) return t.dashboard.defaultUser;
    const lowerName = name.toLowerCase();
    return lowerName.charAt(0).toUpperCase() + lowerName.slice(1);
  };

  const userName = formatName(session?.user?.name);

  return (
    <><DashboardHeader title={t.nav.home} /><div className="space-y-8 p-8">
      {/* Welcome Section */}
      <div className="flex items-center gap-6">
        <div className="shrink-0">
          <Logo width={80} height={80} />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-2">
            {t.dashboard.welcomeTitle} {userName}!
          </h1>
          <p className="text-muted-foreground text-lg">
            {t.dashboard.welcomeSubtitle}
          </p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">{t.dashboard.sectionsTitle}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-2`}
                    >
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.quickTipsTitle}</CardTitle>
          <CardDescription>
            {t.dashboard.quickTipsSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <span>
                {t.dashboard.tip1} <strong>{t.dashboard.tip1Categories}</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              <span>
                {t.dashboard.tip2} <strong>{t.dashboard.tip2Foods}</strong> {t.dashboard.tip2Suffix}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              <span>
                {t.dashboard.tip3} <strong>{t.dashboard.tip3Printers}</strong> {t.dashboard.tip3Suffix}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">4.</span>
              <span>
                {t.dashboard.tip4} <strong>{t.dashboard.tip4Users}</strong> {t.dashboard.tip4Suffix}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">5.</span>
              <span>
                {t.dashboard.tip5} <strong>{t.dashboard.tip5CashRegisters}</strong> {t.dashboard.tip5Suffix}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div></>
  );
}
