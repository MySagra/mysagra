"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Role } from "@/lib/api-types";
import { createUser, checkUsernameExists, patchUser } from "@/actions/users";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";
import {
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  UserIcon,
  KeyRoundIcon,
} from "lucide-react";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onCreated: (user: User) => void;
  editingUser?: User;
  onUpdated?: (user: User) => void;
}

export function UserDialog({
  open,
  onOpenChange,
  roles,
  onCreated,
  editingUser,
  onUpdated,
}: UserDialogProps) {
  const { t } = useLocale();
  const isEdit = !!editingUser;

  // Create mode
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit mode
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
  const [pendingEditUsername, startEditUsernameTransition] = useTransition();
  const [pendingEditPassword, startEditPasswordTransition] = useTransition();

  // ── Create form ────────────────────────────────────────────
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

  // ── Edit username form ─────────────────────────────────────
  const editUsernameSchema = z.object({
    username: z.string().min(4, t.users.usernameMin),
  });
  type EditUsernameForm = z.infer<typeof editUsernameSchema>;

  const editUsernameForm = useForm<EditUsernameForm>({
    resolver: zodResolver(editUsernameSchema),
    defaultValues: { username: editingUser?.username ?? "" },
  });

  // ── Edit password form ─────────────────────────────────────
  const editPasswordSchema = z
    .object({
      password: z.string().min(8, t.users.passwordMin),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t.users.passwordMismatch,
      path: ["confirmPassword"],
    });
  type EditPasswordForm = z.infer<typeof editPasswordSchema>;

  const editPasswordForm = useForm<EditPasswordForm>({
    resolver: zodResolver(editPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      editUsernameForm.reset({ username: editingUser?.username ?? "" });
      editPasswordForm.reset({ password: "", confirmPassword: "" });
      setShowEditPassword(false);
      setShowEditConfirmPassword(false);
    } else {
      form.reset({
        username: "",
        password: "",
        confirmPassword: "",
        roleId: roles[0]?.id || "",
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Handlers ───────────────────────────────────────────────
  async function onSubmit(values: UserFormValues) {
    const usernameTrimmed = values.username.trim();
    const exists = await checkUsernameExists(usernameTrimmed);
    if (exists) {
      toast.error(t.users.usernameDuplicate);
      return;
    }
    const result = await createUser({
      username: usernameTrimmed,
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

  function onSubmitEditUsername(values: EditUsernameForm) {
    startEditUsernameTransition(async () => {
      const result = await patchUser(editingUser!.id, { username: values.username });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onUpdated?.(result.data);
      toast.success(t.users.toastUsernameUpdated);
    });
  }

  function onSubmitEditPassword(values: EditPasswordForm) {
    startEditPasswordTransition(async () => {
      const result = await patchUser(editingUser!.id, { password: values.password });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onUpdated?.(result.data);
      toast.success(t.users.toastPasswordUpdated);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t.users.editTitle : t.users.newTitle}</DialogTitle>
        </DialogHeader>

        {isEdit ? (
          <div className="py-2 space-y-5">
            {/* Username section */}
            <form
              onSubmit={editUsernameForm.handleSubmit(onSubmitEditUsername)}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-username"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <UserIcon className="size-3.5 text-muted-foreground" />
                  {t.users.usernameLabel}
                </Label>
                <Input
                  id="edit-username"
                  placeholder={t.users.usernamePlaceholder}
                  autoFocus
                  {...editUsernameForm.register("username")}
                />
                {editUsernameForm.formState.errors.username && (
                  <p className="text-xs text-destructive">
                    {editUsernameForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={pendingEditUsername}
                className="w-full gap-2"
              >
                {pendingEditUsername ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <UserIcon className="size-4" />
                )}
                {pendingEditUsername ? t.users.saving : t.users.saveUsername}
              </Button>
            </form>

            <Separator />

            {/* Password section */}
            <form
              onSubmit={editPasswordForm.handleSubmit(onSubmitEditPassword)}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-password"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <KeyRoundIcon className="size-3.5 text-muted-foreground" />
                  {t.users.passwordLabel}
                </Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showEditPassword ? "text" : "password"}
                    placeholder={t.users.passwordPlaceholder}
                    className="pr-10"
                    {...editPasswordForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showEditPassword ? t.users.hidePassword : t.users.showPassword}
                  >
                    {showEditPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
                {editPasswordForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {editPasswordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-confirm-password" className="text-sm font-medium">
                  {t.users.confirmPasswordLabel}
                </Label>
                <div className="relative">
                  <Input
                    id="edit-confirm-password"
                    type={showEditConfirmPassword ? "text" : "password"}
                    placeholder={t.users.confirmPasswordPlaceholder}
                    className="pr-10"
                    {...editPasswordForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showEditConfirmPassword ? t.users.hidePassword : t.users.showPassword
                    }
                  >
                    {showEditConfirmPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
                {editPasswordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {editPasswordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={pendingEditPassword}
                className="w-full gap-2"
              >
                {pendingEditPassword ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <KeyRoundIcon className="size-4" />
                )}
                {pendingEditPassword ? t.users.saving : t.users.savePassword}
              </Button>
            </form>
          </div>
        ) : (
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
                              aria-label={
                                showConfirmPassword ? t.users.hidePassword : t.users.showPassword
                              }
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? t.users.saving : t.users.create}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
