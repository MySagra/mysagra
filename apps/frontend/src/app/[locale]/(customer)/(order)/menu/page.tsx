export const dynamic = "force-dynamic";

import MenuButton from "@/components/menu/menuButton";
import { Button } from "@/components/ui/button";
import { Category } from "@/types/category";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { getCategories } from "@/services/categories.service";
import { getTranslations } from "next-intl/server";

export default async function Menu() {
    const categories: Array<Category> = await getCategories();
    const t = await getTranslations("Menu")

    return (
        <div className="flex place-content-center items-center min-h-screen py-20 ">
            <div className="flex flex-col gap-8 place-content-center w-full max-w-[600px] px-8 ">
                {
                    categories.map((category) => (
                        <MenuButton
                            key={category.id}
                            src={`${process.env.API_URL}/uploads/categories/${category.image}`}
                            href={`/menu/${category.id}`}
                            title={category.name}
                        />
                    ))
                }
                <Link href={"/recap"}>
                    <Button variant={"outline"} className="w-full">
                        <ShoppingCart />
                        {t("cartButton")}
                    </Button>
                </Link>
            </div>
        </div>

    )
}