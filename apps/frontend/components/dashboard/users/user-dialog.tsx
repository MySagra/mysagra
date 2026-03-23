"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { User, Role } from "@/lib/api-types";
import { createUser } from "@/actions/users";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onCreated: (user: User) => void;
}

export function UserDialog({ open, onOpenChange, roles, onCreated }: UserDialogProps) {
  const { t } = useLocale();

  const userSchema = z.object({
    username: z.string().min(4, t.users.usernameMin),
    password: z.string().min(8, t.users.passwordMin),
    roleId: z.string().min(1, t.users.roleRequired),
  });

  type UserFormValues = z.infer<typeof userSchema>;

  const form = useForm<UserFormValues>({
    resolver: standardSchemaResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      roleId: roles[0]?.id || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        username: "",
        password: "",
        roleId: roles[0]?.id || "",
      });
    }
  }, [open, roles, form]);

  async function onSubmit(values: UserFormValues) {
    try {
      const created = await createUser({
        username: values.username.trim(),
        password: values.password,
        roleId: values.roleId,
      });
      onCreated(created);
      toast.success(t.users.toastCreated);
    } catch (error: any) {
      toast.error(error.message || t.users.toastErrorSave);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.users.newTitle}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="py-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel required>{t.users.usernameLabel}</FieldLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t.users.usernamePlaceholder}
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </Field>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel required>{t.users.passwordLabel}</FieldLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder={t.users.passwordPlaceholder}
                        />
                      </FormControl>
                      <FormMessage />
                    </Field>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel required>{t.users.roleLabel}</FieldLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={t.users.roleSelectPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </Field>
                  </FormItem>
                )}
              />
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t.users.saving : t.users.create}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
