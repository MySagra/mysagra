import CategoriesList from "./_components/categoriesList"
import { AdminHeader } from "../_components/layout/header"
import { Category } from "@/types/category";
import { getAvailableCategories, getCategories } from "@/services/categories.service";
import { getTranslations } from "next-intl/server";
import { getQueryClient } from "@/lib/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function Categories() {
    const queryClient = getQueryClient();

    await queryClient.prefetchQuery({
        queryKey: ["categories"],
        queryFn: getCategories
    })
    
    const imageURL = `${process.env.API_URL}/uploads/categories`

    const t = await getTranslations('Category');

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <AdminHeader title={t('categoryManagement')} />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <CategoriesList imageURL={imageURL}/>
                    </div>
                </div>
            </div>
        </HydrationBoundary>
    )
}
