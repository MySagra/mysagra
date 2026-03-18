"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Lock,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setupNewAdmin } from "@/actions/setup";
import { login as loginAction } from "@/actions/auth";
import { useLocale } from "@/contexts/locale-context";

type Step = "warning" | "form" | "success";

export function SetupWizard() {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>("warning");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setupSchema = z
    .object({
      username: z.string().min(4, t.setup.usernameMin),
      password: z.string().min(8, t.setup.passwordMin),
      confirmPassword: z.string().min(1, t.setup.confirmPasswordRequired),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.setup.passwordMismatch,
      path: ["confirmPassword"],
    });

  type SetupFormValues = z.infer<typeof setupSchema>;

  const form = useForm<SetupFormValues>({
    resolver: standardSchemaResolver(setupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onSubmit(values: SetupFormValues) {
    setIsSubmitting(true);
    try {
      const result = await setupNewAdmin(values.username, values.password);
      if (!result.success) {
        toast.error(result.error || t.setup.errorGeneric);
        return;
      }
      setStep("success");
      // Auto-login with new credentials: overwrite the old admin session
      // cookies with the new user's session, then land directly on dashboard.
      setTimeout(async () => {
        const loginResult = await loginAction(values.username, values.password);
        window.location.href = loginResult.success
          ? "/dashboard"
          : "/api/auth/force-logout";
      }, 2500);
    } catch {
      toast.error(t.setup.errorUnexpected);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {step === "warning" && (
        <Card className="border-amber-200 dark:border-amber-800 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </span>
              </div>
            </div>
            <CardTitle className="text-center text-xl">
              {t.setup.warningTitle}
            </CardTitle>
            <CardDescription className="text-center text-sm leading-relaxed">
              {t.setup.warningDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                {t.setup.warningWhatHappens}
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-500">•</span>
                  {t.setup.warningStep1}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-500">•</span>
                  {t.setup.warningStep2}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-500">•</span>
                  {t.setup.warningStep3}
                </li>
              </ul>
            </div>
            <Button onClick={() => setStep("form")} className="w-full gap-2">
              {t.setup.startButton}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "form" && (
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center text-xl">
              {t.setup.formTitle}
            </CardTitle>
            <CardDescription className="text-center text-sm">
              {t.setup.formDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="username"
                    className="flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    {t.setup.usernameLabel}
                  </Label>
                  <Input
                    id="username"
                    autoComplete="off"
                    placeholder={t.setup.usernamePlaceholder}
                    {...register("username")}
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {t.setup.passwordLabel}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t.setup.passwordPlaceholder}
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {t.setup.confirmPasswordLabel}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t.setup.confirmPasswordPlaceholder}
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.setup.submitting}
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        {t.setup.submitButton}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => setStep("warning")}
                    disabled={isSubmitting}
                  >
                    {t.setup.back}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      )}

      {step === "success" && (
        <Card className="border-green-200 dark:border-green-800 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-center text-xl">
              {t.setup.successTitle}
            </CardTitle>
            <CardDescription className="text-center text-sm">
              {t.setup.successDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
              <p className="text-sm text-green-700 dark:text-green-400 text-center">
                {t.setup.successMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
