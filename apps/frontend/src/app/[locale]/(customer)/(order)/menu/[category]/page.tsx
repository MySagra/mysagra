import { Foods } from "@/components/food/foodCard";
import { getFoodsAvailable } from "@/services/foods.service";
import { getQueryClient } from "@/lib/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function MenuCategoryPage({
    params
}: {
    params: Promise<{ category: string }>
}) {
    const { category } = await params;
    const queryClient = getQueryClient();

    await queryClient.prefetchQuery({
        queryKey: ["categoryFoods", category],
        queryFn: () => getFoodsAvailable(category)
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <div className="pt-[60px] min-h-screen">
                <div className="flex flex-col gap-6 p-3 ">
                    <Foods category={category} />
                </div>
            </div>
        </HydrationBoundary>
    );
}