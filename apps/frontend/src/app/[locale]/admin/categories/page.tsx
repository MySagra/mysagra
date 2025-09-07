export const dynamic = "force-dynamic";

import CategoriesList from "./_components/categoriesList"
import { AdminHeader } from "../_components/layout/header"
import { Category } from "@/types/category";
import { getCategories } from "@/services/categories.service";
import { getTranslations } from "next-intl/server";

export default async function Categories() {
    const categories: Array<Category> = await getCategories();
    const imageURL = `${process.env.API_URL}/uploads/categories`

    const t = await getTranslations('Category');

    return (
        <>
            <AdminHeader title={t('categoryManagement')} />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <CategoriesList imageURL={imageURL} initialCategories={categories} />
                    </div>
                </div>
            </div>
        </>
    )
}
