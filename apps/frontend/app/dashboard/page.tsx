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
  TrendingUp,
  Calendar,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { useSession } from "next-auth/react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

const navigationCards = [
  {
    title: "Categories",
    description: "Manage menu categories",
    icon: ChefHat,
    href: "/dashboard/categories",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    title: "Foods",
    description: "Manage menu products",
    icon: UtensilsCrossed,
    href: "/dashboard/foods",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    title: "Ingredients",
    description: "Manage available ingredients",
    icon: Leaf,
    href: "/dashboard/ingredients",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    title: "Printers",
    description: "Configure network printers",
    icon: Printer,
    href: "/dashboard/printers",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    title: "Users",
    description: "Manage system users",
    icon: Users,
    href: "/dashboard/users",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    title: "Cash Registers",
    description: "Configure cash registers",
    icon: Landmark,
    href: "/dashboard/cash-registers",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
  },
  {
    title: "Orders",
    description: "View and manage orders",
    icon: ShoppingBag,
    href: "/dashboard/orders",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  const formatName = (name: string | null | undefined) => {
    if (!name) return "User";
    const lowerName = name.toLowerCase();
    return lowerName.charAt(0).toUpperCase() + lowerName.slice(1);
  };

  const userName = formatName(session?.user?.name);

  return (
    <><DashboardHeader title="Home" /><div className="space-y-8 p-8">
      {/* Welcome Section */}
      <div className="flex items-center gap-6">
        <div className="shrink-0">
          <Logo width={80} height={80} />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Welcome {userName}!
          </h1>
          <p className="text-muted-foreground text-lg">
            MySagra Management System - Complete administration of your event
          </p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Sections</h2>
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
          <CardTitle>Quick Tips</CardTitle>
          <CardDescription>
            Start with basic configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <span>
                First configure the menu <strong>Categories</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              <span>
                Add <strong>Foods</strong> and assign them to categories
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              <span>
                Set up <strong>Printers</strong> for the kitchen
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">4.</span>
              <span>
                Create <strong>Users</strong> for staff members
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">5.</span>
              <span>
                Configure <strong>Cash Registers</strong> at sales points
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div></>
  );
}
