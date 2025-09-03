import { z } from "zod"

export function getUserFormSchema(t: (key: string) => string) {
    return z.object({
        username: z.string({ required_error: t('validation.username') }).min(4, { message: t('validation.usernameLength') }).max(50),
        password: z.string({ required_error: t('validation.password') }).min(8, { message: t('validation.passwordLength') }),
        roleId: z.number({ required_error: t('validation.role') })
    })
}

export type UserFormValues = z.infer<Awaited<ReturnType<typeof getUserFormSchema>>>