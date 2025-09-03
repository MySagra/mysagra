export const dynamic = "force-dynamic";

import { FoodList } from "./_components/foodlist";
import { AdminHeader } from "../_components/layout/header"
import { getCategories } from "@/services/categories.service";
import { getFoods } from "@/services/foods.service";
import { getTranslations } from "next-intl/server";

export default async function Food() {
    const t = await getTranslations('Food');
    const foods = await getFoods();
    const categories = await getCategories();

    return (
        <>
            <AdminHeader title={t('foodManagement')} />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <FoodList initialFoods={foods} categories={categories} />
                    </div>
                </div>
            </div>
        </>
    )
}
