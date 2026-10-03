"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { checkUsernameExists, createUser, patchUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLocale } from "@/contexts/locale-context";
import type { Role, User } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { useRoleInfo } from "./role-info";

interface UserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  // undefined: create a new user
  user?: User;
  onSaved: (user: User, created: boolean) => void;
}

export function UserSheet({ open, onOpenChange, roles, user, onSaved }: UserSheetProps) {
  const { t } = useLocale();
  const roleInfo = useRoleInfo();
  const isEdit = !!user;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [errors, setErrors] = useState<{ username?: string; password?: string; confirmPassword?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsername(user?.username ?? "");
    setPassword("");
    setConfirmPassword("");
    setRoleId(user?.roleId ?? roles.find((r) => r.name === "operator")?.id ?? roles[0]?.id ?? "");
    setErrors({});
    setShowPassword(false);
  }, [open, user, roles]);

  async function save() {
    const found: { username?: string; password?: string; confirmPassword?: string } = {};
    const trimmed = username.trim();
    if (trimmed.length < 4) found.username = t.adminSettings.usernameMin;
    if ((!isEdit || password) && password.length < 8) found.password = t.adminSettings.passwordMin;
    if (password && confirmPassword !== password) found.confirmPassword = t.adminSettings.passwordMismatch;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    const usernameChanged = !isEdit || trimmed !== user.username;
    if (usernameChanged && (await checkUsernameExists(trimmed, user?.id))) {
      setErrors({ username: t.adminSettings.usernameTaken });
      setIsSaving(false);
      return;
    }

    const result = isEdit
      ? await patchUser(user.id, {
          ...(usernameChanged ? { username: trimmed } : {}),
          ...(password ? { password } : {}),
          ...(roleId !== user.roleId ? { role: roleId } : {}),
        })
      : await createUser({ username: trimmed, password, roleId });
    setIsSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? t.adminSettings.toastUpdated : t.adminSettings.toastCreated);
    onSaved(result.data, !isEdit);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{isEdit ? t.adminSettings.editUser : t.adminSettings.newUser}</SheetTitle>
          <SheetDescription className="sr-only">{t.adminSettings.usersDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label htmlFor="user-sheet-username" className="font-semibold">{t.adminSettings.usernameLabel}</Label>
            <Input
              id="user-sheet-username"
              autoComplete="off"
              maxLength={100}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={!!errors.username}
            />
            {errors.username
              ? <p className="text-xs text-destructive">{errors.username}</p>
              : <p className="text-xs text-muted-foreground">{t.adminSettings.usernameHint}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-sheet-password" className="font-semibold">
              {isEdit ? t.adminSettings.passwordEditLabel : t.adminSettings.passwordLabel}
            </Label>
            <div className="flex gap-2">
              <Input
                id="user-sheet-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                maxLength={100}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
              >
                {showPassword ? t.setup.hide : t.setup.show}
              </Button>
            </div>
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password}</p>
            ) : (
              isEdit && <p className="text-xs text-muted-foreground">{t.adminSettings.passwordEditHint}</p>
            )}
          </div>

          {/* in edit mode the confirmation appears only once a new password is typed */}
          {(!isEdit || password) && (
            <div className="space-y-2">
              <Label htmlFor="user-sheet-confirm-password" className="font-semibold">
                {t.adminSettings.confirmPasswordLabel}
              </Label>
              <Input
                id="user-sheet-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                maxLength={100}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold">{t.adminSettings.roleLabel}</p>
            <div role="radiogroup" aria-label={t.adminSettings.roleLabel} className="space-y-2">
              {roles.map((role) => {
                const info = roleInfo(role.name);
                const checked = roleId === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setRoleId(role.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      checked ? "border-primary bg-primary/10" : "bg-card hover:bg-muted/50"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                        checked ? "border-primary" : "border-muted-foreground/50"
                      )}
                    >
                      {checked && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    <span className="space-y-0.5">
                      <span className="block text-sm font-semibold">{info.label}</span>
                      {info.hint && <span className="block text-xs text-muted-foreground">{info.hint}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t.adminSettings.cancel}
          </Button>
          <Button onClick={save} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? t.adminSettings.saveUser : t.adminSettings.create}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
