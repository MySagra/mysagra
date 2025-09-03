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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { Role, User } from "@/types/user"
import { useTranslations } from "next-intl"

import { UserFormValues, getUserFormSchema } from "@/schemas/userForm"
import { toast } from "sonner"

interface UserDialogProp {
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
    roles: Array<Role>
}

export function UserDialog({ setUsers, roles }: UserDialogProp) {
    const t = useTranslations('User')

    const form = useForm<UserFormValues>({
        resolver: zodResolver(getUserFormSchema(t)),
        defaultValues: {
            username: "",
            password: "",
            roleId: 1
        }
    })

    function createUser(values: UserFormValues) {
        fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
        }).then(async res => {
            const data = await res.json();
            if (!res.ok) return;
            form.reset();
            setUsers(prev =>
                [...prev, data]
            );
        }).then(() => {
            toast.success(t('toast.createSuccess'));
        }).catch(err => {
            toast.error(t('toast.createError'));
            console.error(err);
        })
    }

    return (
        <Dialog>
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
                    onSubmit={createUser}
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
                <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formFields.role')}</FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                defaultValue={field.value.toString()}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {
                                        roles.map(role =>
                                            <SelectItem key={role.id} value={role.id.toString()}>
                                                {role.name}
                                            </SelectItem>
                                        )
                                    }
                                </SelectContent>
                            </Select>
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