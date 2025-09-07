import { z } from "zod"

export function getFoodFormSchema(t: (key: string) => string) {
    return z.object({
        name: z.string({ required_error: t('validation.name')}).min(2, t('validation.nameLength')).max(50),
        description: z.string().min(0).max(200),
        price: z.string({ required_error: t('validation.price')})
            .min(1, t('validation.price'))
            .refine(val => {
                const num = parseFloat(val);
                return !isNaN(num) && num > 0;
            }, {
                message: t('validation.priceMinValue')
            })
            .refine(val => {
                // Verifica che abbia massimo 2 decimali
                return /^\d+(\.\d{1,2})?$/.test(val);
            }, {
                message: t('validation.priceFormat')
            }),
        categoryId: z.number({
            required_error: t('validation.category')
        }).min(0, t('validation.category')),
        available: z.boolean({ required_error: t('validation.available')})
    })
}

export type FoodFormValues = z.infer<Awaited<ReturnType<typeof getFoodFormSchema>>>