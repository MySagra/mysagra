import { z } from "zod"

export function getCategoryFormSchema(t: (key: string) => string) {
    return z.object({
        name: z.string({ required_error: t('validation.name')}).min(2, {message: t('validation.nameLength')}).max(50),
        position: z.string({ required_error: t('validation.position')} )
            .min(1)
            .refine(val => !isNaN(Number(val)), {
                message: "Required a number"
            }),
        available: z.boolean( { required_error: t('validation.available')}),
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

export type CategoryFormValues = z.infer<Awaited<ReturnType<typeof getCategoryFormSchema>>>