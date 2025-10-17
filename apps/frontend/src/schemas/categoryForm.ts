import { z } from "zod"

// Validation schema for category form
export function getCategoryFormSchema(t: (key: string) => string) {
    return z.object({
        name: z.string({ required_error: t('validation.name')})
            .min(2, {message: t('validation.nameLength')})
            .max(50),
        // Use z.coerce.number to automatically convert string input to number
        position: z.coerce.number({ 
            required_error: t('validation.position'),
            invalid_type_error: t('validation.positionValid')
        })
            .int()
            .min(1, { message: t('validation.positionMin') }),
        available: z.boolean({ required_error: t('validation.available')}),
        image: z
            .instanceof(File)
            .optional()
            .refine((file) => {
                if (!file) return true;
                return file.size <= 5 * 1024 * 1024; // Max 5MB
            }, t('validation.imageSize'))
            .refine((file) => {
                if (!file) return true;
                return ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
            }, t('validation.imageFormat'))
    })
}

// Type inferred from the schema for form values
export type CategoryFormValues = z.infer<ReturnType<typeof getCategoryFormSchema>>