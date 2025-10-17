import { z } from "zod"

// Validation schema for user form
export function getUserFormSchema(t: (key: string) => string) {
    return z.object({
        username: z.string({ required_error: t('validation.username') })
            .min(4, { message: t('validation.usernameLength') })
            .max(50),
        password: z.string({ required_error: t('validation.password') })
            .min(8, { message: t('validation.passwordLength') }),
        roleId: z.number({ required_error: t('validation.role') })
    })
}

// Type inferred from the schema for form values
export type UserFormValues = z.infer<ReturnType<typeof getUserFormSchema>>