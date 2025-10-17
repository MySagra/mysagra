import { z } from "zod"

// Validation schema for food form
export function getFoodFormSchema(t: (key: string) => string) {
    return z.object({
        name: z.string({ required_error: t('validation.name')})
            .min(2, t('validation.nameLength'))
            .max(50),
        description: z.string()
            .max(200),
        // Use z.coerce.number to automatically convert string input to number
        price: z.coerce.number({
            required_error: t('validation.price'),
            invalid_type_error: t('validation.priceFormat')
        })
            .min(0, { message: t('validation.priceMinValue') })
            .refine((val) => {
                // Check that it has maximum 2 decimal places
                return /^\d+(\.\d{1,2})?$/.test(val.toString());
            }, {
                message: t('validation.priceFormat')
            }),
        categoryId: z.number({
            required_error: t('validation.category'),
            invalid_type_error: t('validation.category')
        })
            .int()
            .min(1, { message: t('validation.category') }),
        available: z.boolean({ required_error: t('validation.available')})
    })
}

// Type inferred from the schema for form values
export type FoodFormValues = z.infer<ReturnType<typeof getFoodFormSchema>>