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
  CopyIcon,
  CheckIcon,
  PrinterIcon,
  MonitorIcon,
  EyeIcon,
  EyeOffIcon,
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
import { cn } from "@/lib/utils";

type Step = "warning" | "form" | "api-keys" | "keys" | "success";

const CARD_CLASS = "shadow-lg flex flex-col h-[520px]";
const CONTENT_CLASS = "flex-1 overflow-y-auto";

export function SetupWizard() {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>("warning");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printerKey, setPrinterKey] = useState<string>("");
  const [webappKey, setWebappKey] = useState<string>("");
  const [copiedPrinter, setCopiedPrinter] = useState(false);
  const [copiedWebapp, setCopiedWebapp] = useState(false);
  const [visiblePrinter, setVisiblePrinter] = useState(false);
  const [visibleWebapp, setVisibleWebapp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatePrinterKey, setGeneratePrinterKey] = useState(true);
  const [generateWebappKey, setGenerateWebappKey] = useState(true);

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
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  async function onSubmit(_values: SetupFormValues) {
    setStep("api-keys");
  }

  async function handleSubmitWithKeys() {
    const values = form.getValues();
    setIsSubmitting(true);
    try {
      const result = await setupNewAdmin(values.username, values.password, {
        generatePrinterKey,
        generateWebappKey,
      });
      if (!result.success) {
        toast.error(result.error || t.setup.errorGeneric);
        return;
      }
      const hasKeys = result.printerKey || result.webappKey;
      setPrinterKey(result.printerKey ?? "");
      setWebappKey(result.webappKey ?? "");
      if (hasKeys) {
        setStep("keys");
      } else {
        setStep("success");
        setTimeout(async () => {
          const loginResult = await loginAction(values.username, values.password);
          window.location.href = loginResult.success ? "/dashboard" : "/api/auth/force-logout";
        }, 2500);
      }
    } catch {
      toast.error(t.setup.errorUnexpected);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleContinueFromKeys() {
    setStep("success");
    setTimeout(async () => {
      const values = form.getValues();
      const loginResult = await loginAction(values.username, values.password);
      window.location.href = loginResult.success ? "/dashboard" : "/api/auth/force-logout";
    }, 2500);
  }

  async function handleCopyPrinter() {
    await navigator.clipboard.writeText(printerKey);
    setCopiedPrinter(true);
    setTimeout(() => setCopiedPrinter(false), 2000);
  }

  async function handleCopyWebapp() {
    await navigator.clipboard.writeText(webappKey);
    setCopiedWebapp(true);
    setTimeout(() => setCopiedWebapp(false), 2000);
  }

  return (
    <div className="w-full max-w-md">

      {/* ── WARNING ── */}
      {step === "warning" && (
        <Card className={cn(CARD_CLASS, "border-amber-200 dark:border-amber-800")}>
          <CardHeader className="pb-4 shrink-0">
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
            <CardTitle className="text-center text-xl">{t.setup.warningTitle}</CardTitle>
            <CardDescription className="text-center text-sm leading-relaxed">
              {t.setup.warningDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className={cn(CONTENT_CLASS, "space-y-4")}>
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

      {/* ── FORM ── */}
      {step === "form" && (
        <Card className={cn(CARD_CLASS)}>
          <CardHeader className="pb-4 shrink-0">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center text-xl">{t.setup.formTitle}</CardTitle>
            <CardDescription className="text-center text-sm">{t.setup.formDescription}</CardDescription>
          </CardHeader>
          <CardContent className={cn(CONTENT_CLASS)}>
            <FormProvider {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 h-full flex flex-col">
                <div className="space-y-4 flex-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="flex items-center gap-1.5">
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
                      <p className="text-xs text-destructive">{errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      {t.setup.passwordLabel}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={t.setup.passwordPlaceholder}
                        className="pr-10"
                        {...register("password")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      {t.setup.confirmPasswordLabel}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={t.setup.confirmPasswordPlaceholder}
                        className="pr-10"
                        {...register("confirmPassword")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                      >
                        {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button type="submit" className="w-full gap-2">
                    <ArrowRight className="w-4 h-4" />
                    {t.setup.nextButton}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => setStep("warning")}
                  >
                    {t.setup.back}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      )}

      {/* ── API KEYS SELECTION ── */}
      {step === "api-keys" && (
        <Card className={cn(CARD_CLASS)}>
          <CardHeader className="pb-4 shrink-0">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center text-xl">{t.setup.keysGenerateTitle}</CardTitle>
            <CardDescription className="text-center text-sm">{t.setup.keysGenerateDescription}</CardDescription>
          </CardHeader>
          <CardContent className={cn(CONTENT_CLASS, "flex flex-col")}>
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* PRINTER card */}
                <button
                  type="button"
                  onClick={() => setGeneratePrinterKey((v) => !v)}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-lg border-2 p-3 text-left transition-all",
                    generatePrinterKey
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/40"
                  )}
                >
                  {generatePrinterKey && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />
                    </span>
                  )}
                  <div className={cn(
                    "rounded-md p-1.5",
                    generatePrinterKey ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <PrinterIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{t.apiKeys.typePrinter}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.apiKeys.typePrinterDesc}</p>
                  </div>
                </button>

                {/* WEBAPP card */}
                <button
                  type="button"
                  onClick={() => setGenerateWebappKey((v) => !v)}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-lg border-2 p-3 text-left transition-all",
                    generateWebappKey
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/40"
                  )}
                >
                  {generateWebappKey && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />
                    </span>
                  )}
                  <div className={cn(
                    "rounded-md p-1.5",
                    generateWebappKey ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <MonitorIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{t.apiKeys.typeWebapp}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.apiKeys.typeWebappDesc}</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Button
                className="w-full gap-2"
                disabled={isSubmitting}
                onClick={handleSubmitWithKeys}
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
                onClick={() => setStep("form")}
                disabled={isSubmitting}
              >
                {t.setup.back}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KEYS REVEAL ── */}
      {step === "keys" && (
        <Card className={cn(CARD_CLASS, "border-blue-200 dark:border-blue-800")}>
          <CardHeader className="pb-4 shrink-0">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-center text-xl">{t.setup.keysTitle}</CardTitle>
            <CardDescription className="text-center text-sm">{t.setup.keysDescription}</CardDescription>
          </CardHeader>
          <CardContent className={cn(CONTENT_CLASS, "flex flex-col")}>
            <div className="flex-1 space-y-3">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
                <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                <p className="text-sm text-amber-700 dark:text-amber-400">{t.setup.keysWarning}</p>
              </div>

              {printerKey && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <PrinterIcon className="w-3.5 h-3.5" />
                    {t.setup.keysPrinterLabel}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        readOnly
                        type={visiblePrinter ? "text" : "password"}
                        value={printerKey}
                        className="font-mono text-xs pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setVisiblePrinter((v) => !v)}
                      >
                        {visiblePrinter ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyPrinter}>
                      {copiedPrinter
                        ? <CheckIcon className="h-4 w-4 text-green-600" />
                        : <CopyIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {webappKey && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <MonitorIcon className="w-3.5 h-3.5" />
                    {t.setup.keysWebappLabel}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        readOnly
                        type={visibleWebapp ? "text" : "password"}
                        value={webappKey}
                        className="font-mono text-xs pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setVisibleWebapp((v) => !v)}
                      >
                        {visibleWebapp ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyWebapp}>
                      {copiedWebapp
                        ? <CheckIcon className="h-4 w-4 text-green-600" />
                        : <CopyIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button onClick={handleContinueFromKeys} className="w-full gap-2">
                <ArrowRight className="w-4 h-4" />
                {t.setup.keysContinueButton}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SUCCESS ── */}
      {step === "success" && (
        <Card className={cn(CARD_CLASS, "border-green-200 dark:border-green-800")}>
          <CardHeader className="pb-4 shrink-0">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-center text-xl">{t.setup.successTitle}</CardTitle>
            <CardDescription className="text-center text-sm">{t.setup.successDescription}</CardDescription>
          </CardHeader>
          <CardContent className={cn(CONTENT_CLASS)}>
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
