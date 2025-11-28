import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { Role } from "@/types/user"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { UserFormValues, getUserFormSchema } from "@/schemas/userForm"
import { toast } from "sonner"
import { useCreateUser } from "@/hooks/api/users"

interface UserDialogProp {
    roles: Array<Role>
}

export function UserDialog({ roles }: UserDialogProp) {
    const t = useTranslations('User');
    const [open, setOpen] = useState(false);
    
    const createUserMutation = useCreateUser();

    const form = useForm<UserFormValues>({
        resolver: zodResolver(getUserFormSchema(t)),
        defaultValues: {
            username: "",
            password: "",
            roleId: 1
        }
    });

    // Handler to create a new user
    async function handleCreateUser(values: UserFormValues) {
        try {
            await createUserMutation.mutateAsync(values);
            toast.success(t('toast.createSuccess'));
            form.reset();
            setOpen(false);
        } catch (error) {
            toast.error(t('toast.createError'));
            console.error(error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {
                    <Button className="w-min">
                        <PlusCircle />
                        {t('dialog.trigger')}
                    </Button>
                }
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t('dialog.title')}
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <UserForm
                    form={form}
                    onSubmit={handleCreateUser}
                    roles={roles}
                />
            </DialogContent>
        </Dialog>
    )
}

interface UserFormProps {
    form: ReturnType<typeof useForm<UserFormValues>>;
    onSubmit: (values: UserFormValues) => void;
    roles: Array<Role>
}

function UserForm({ form, onSubmit, roles }: UserFormProps) {
    console.log(roles)
    const t = useTranslations('User')
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formFields.username')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('dialog.username.placeholder')} {...field} />
                            </FormControl>
                            <FormDescription>
                                {t('dialog.username.description')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formFields.password')}</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder={t('dialog.password.placeholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t('dialog.cancel')}</Button>
                    </DialogClose>
                    <Button type="submit">{t('dialog.create')}</Button>
                </DialogFooter>
            </form>
        </Form>
    )
}