export const dynamic = "force-dynamic";

import { AdminHeader } from "../_components/layout/header"

import OrderBarChart from "./_components/orderBarChart";
import { OrderRadialChart } from "./_components/orderRadialChart";
import { FoodPieChart } from "./_components/foodPieChart";
import { RevenueAreaChart } from "./_components/revenueAreaChart";
import React from "react";
import { getOrderStats, getFoodsOrderedStats, getRevenueStats } from "@/services/stats.service";
import { getTranslations } from "next-intl/server";

export default async function Analytics() {

    const t = await getTranslations('Analytics');

    const ordersStats = await getOrderStats();
    const foodsStats = await getFoodsOrderedStats();
    const revenueStats = await getRevenueStats();
    const totalFoods = foodsStats.foodOrdered.reduce((acc: number, curr: { quantity: string }) => acc + parseInt(curr.quantity), 0)

    return (
        <>
            <AdminHeader title={t("analytics")} />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 px-4 lg:px-6">
                            <div className="col-span-3 grid grid-cols-2 xl:grid-cols-3 gap-3">
                                <OrderBarChart stats={ordersStats} className={"col-span-2 h-[370px]"} />
                                <OrderRadialChart totalOrders={ordersStats.totalOrders} className=" col-span-2 xl:col-span-1" />
                            </div>

                            <div className="col-span-3 grid grid-cols-2 xl:grid-cols-3 gap-3">
                                <FoodPieChart totalFoods={totalFoods} stats={foodsStats} className="col-span-2 xl:col-span-1 h-[370px]" />
                                <RevenueAreaChart stats={revenueStats} className="col-span-2 h-[370px]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}