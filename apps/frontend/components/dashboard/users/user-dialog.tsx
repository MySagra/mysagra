"use client";

import { useEffect, useState } from "react";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";
import { EyeIcon, EyeOffIcon } from "lucide-react";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onCreated: (user: User) => void;
}

export function UserDialog({ open, onOpenChange, roles, onCreated }: UserDialogProps) {
  const { t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const userSchema = z
    .object({
      username: z.string().min(4, t.users.usernameMin),
      password: z.string().min(8, t.users.passwordMin),
      confirmPassword: z.string().min(1, t.users.confirmPasswordRequired),
      roleId: z.string().min(1, t.users.roleRequired),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.users.passwordMismatch,
      path: ["confirmPassword"],
    });

  type UserFormValues = z.infer<typeof userSchema>;

  const form = useForm<UserFormValues>({
    resolver: standardSchemaResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      roleId: roles[0]?.id || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        username: "",
        password: "",
        confirmPassword: "",
        roleId: roles[0]?.id || "",
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, roles, form]);

  async function onSubmit(values: UserFormValues) {
    const result = await createUser({
      username: values.username.trim(),
      password: values.password,
      roleId: values.roleId,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onCreated(result.data);
    toast.success(t.users.toastCreated);
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
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder={t.users.passwordPlaceholder}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={showPassword ? t.users.hidePassword : t.users.showPassword}
                          >
                            {showPassword ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </Field>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel required>{t.users.confirmPasswordLabel}</FieldLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={t.users.confirmPasswordPlaceholder}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={showConfirmPassword ? t.users.hidePassword : t.users.showPassword}
                          >
                            {showConfirmPassword ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
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
