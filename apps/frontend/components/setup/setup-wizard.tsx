"use client";

import { useState } from "react";
import type { SettingsData } from "@mysagra/schemas";
import { InfoIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runSetup } from "@/actions/setup";
import { login } from "@/actions/auth";
import { useLocale } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import { SetupCashierStep } from "./setup-cashier-step";
import { validateCashierSettings } from "@/components/settings/cashier-settings";
import { SetupSummaryStep } from "./setup-summary-step";
import { Field } from "./setup-field";
import { SetupLanguageSwitcher } from "./setup-language-switcher";
import { SetupCreating, SetupDone } from "./setup-finish";

export type SetupData = {
  token: string;
  sagraName: string;
  username: string;
  password: string;
  confirmPassword: string;
  settings: SettingsData;
};

export type SetupErrors = Partial<Record<string, string>>;

type Step = "token" | "sagra" | "account" | "cashier" | "summary";

const STEPS: Step[] = ["token", "sagra", "account", "cashier", "summary"];
const SAGRA_NAME_MAX = 100;
const HELP_URL = "https://www.mysagra.com/";
// the "creating" screen stays visible at least this long, then holds with every task checked
const MIN_CREATING_MS = 3000;
const FINISHED_HOLD_MS = 800;

interface SetupWizardProps {
  // SettingsDataSchema defaults, parsed on the server so they are defined in one place
  defaultSettings: SettingsData;
}

export function SetupWizard({ defaultSettings }: SetupWizardProps) {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>("token");
  const [data, setData] = useState<SetupData>({
    token: "",
    sagraName: "",
    username: "",
    password: "",
    confirmPassword: "",
    settings: defaultSettings,
  });
  const [errors, setErrors] = useState<SetupErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // "form" while filling the steps, "creating" while the request runs, "done" at the end
  const [phase, setPhase] = useState<"form" | "creating" | "done">("form");
  // all creation tasks shown as completed, right before the done screen
  const [creatingFinished, setCreatingFinished] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const stepLabels: Record<Step, string> = {
    token: t.setup.stepToken,
    sagra: t.setup.stepSagra,
    account: t.setup.stepAccount,
    cashier: t.setup.stepCashier,
    summary: t.setup.stepSummary,
  };

  function update<K extends keyof SetupData>(key: K, value: SetupData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(current: Step): SetupErrors {
    const next: SetupErrors = {};

    if (current === "token" && !data.token.trim()) {
      next.token = t.setup.tokenRequired;
    }

    if (current === "sagra" && !data.sagraName.trim()) {
      next.sagraName = t.setup.sagraRequired;
    }

    if (current === "account") {
      if (data.username.trim().length < 4) next.username = t.setup.usernameMin;
      if (data.password.length < 8) next.password = t.setup.passwordMin;
      if (data.confirmPassword !== data.password) next.confirmPassword = t.setup.passwordMismatch;
    }

    if (current === "cashier") {
      Object.assign(next, validateCashierSettings(data.settings, t));
    }

    return next;
  }

  function goNext() {
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStep(STEPS[stepIndex + 1]);
  }

  function goBack() {
    setErrors({});
    setStep(STEPS[stepIndex - 1]);
  }

  // sign in only now: doing it inside the setup action would refresh /setup and skip the done screen
  async function startSagra(): Promise<boolean> {
    const result = await login(data.username.trim(), data.password);
    if (result.success) window.location.href = "/dashboard";
    return result.success;
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setCreatingFinished(false);
    setPhase("creating");
    const startedAt = Date.now();
    const { orders } = data.settings;

    const result = await runSetup({
      token: data.token.trim(),
      sagra: { name: data.sagraName.trim() },
      user: { username: data.username.trim(), password: data.password },
      settings: {
        ...data.settings,
        orders: {
          ...orders,
          // the highest table number only makes sense when the table is a number
          maxTables: orders.table !== "HIDDEN" && orders.tableInputs.includes("NUMBER") ? orders.maxTables : null,
        },
      },
    });

    setIsSubmitting(false);

    if (result.ok) {
      // keep the waiting screen long enough to be read instead of flashing
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_CREATING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_CREATING_MS - elapsed));
      }
      setCreatingFinished(true);
      await new Promise((resolve) => setTimeout(resolve, FINISHED_HOLD_MS));
      setPhase("done");
      return;
    }

    setPhase("form");

    switch (result.error) {
      case "invalid_token":
        setStep("token");
        setErrors({ token: t.setup.tokenInvalid });
        return;
      case "already_setup":
        toast.error(t.setup.errorAlreadySetup);
        window.location.href = "/login";
        return;
      case "too_many_attempts":
        toast.error(t.setup.errorTooManyAttempts);
        return;
      default:
        toast.error(result.message || t.setup.errorGeneric);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="h-9 w-auto select-none" />
          <span className="font-semibold">MySagra</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">{t.setup.breadcrumb}</span>
        </div>
        <a
          href={HELP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t.setup.help}
        </a>
      </header>

      {/* ── Progress ── */}
      {phase === "form" && (
        <nav aria-label={t.setup.breadcrumb} className="mx-auto w-full max-w-3xl px-6">
          <ol className="grid grid-cols-5 gap-2">
            {STEPS.map((s, index) => (
              <li key={s} className="flex flex-col gap-2" aria-current={s === step ? "step" : undefined}>
                <span
                  className={cn(
                    "h-1 rounded-full transition-colors",
                    index <= stepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
                <span
                  className={cn(
                    "text-xs truncate",
                    s === step ? "font-semibold text-foreground" : index < stepIndex ? "text-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {stepLabels[s]}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* ── Content ── */}
      <main className="flex-1 flex justify-center px-6 py-12">
        {phase === "creating" ? (
          <SetupCreating sagraName={data.sagraName.trim()} finished={creatingFinished} />
        ) : phase === "done" ? (
          <SetupDone sagraName={data.sagraName.trim()} onStart={startSagra} />
        ) : (
          <div className={cn("w-full", step === "cashier" ? "max-w-5xl" : "max-w-2xl")}>
            {step === "token" && (
              <StepLayout title={t.setup.tokenTitle} description={t.setup.tokenDescription}>
                <Field label={t.setup.tokenLabel} htmlFor="setup-token" error={errors.token}>
                  <Input
                    id="setup-token"
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 font-mono"
                    value={data.token}
                    onChange={(e) => update("token", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goNext()}
                    aria-invalid={!!errors.token}
                  />
                </Field>
                <div className="flex gap-3 rounded-xl border bg-card p-4 text-sm">
                  <InfoIcon className="size-4 shrink-0 mt-0.5 text-primary" />
                  <div className="space-y-1">
                    <p className="font-medium">{t.setup.tokenWhereTitle}</p>
                    <p className="text-muted-foreground">
                      {t.setup.tokenWhereBefore}{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">SETUP_TOKEN</code>
                      {t.setup.tokenWhereAfter}
                    </p>
                  </div>
                </div>
              </StepLayout>
            )}

            {step === "sagra" && (
              <StepLayout title={t.setup.sagraTitle} description={t.setup.sagraDescription}>
                <Field label={t.setup.sagraLabel} htmlFor="setup-sagra" error={errors.sagraName}>
                  <Input
                    id="setup-sagra"
                    autoFocus
                    className="h-11"
                    maxLength={SAGRA_NAME_MAX}
                    placeholder={t.setup.sagraPlaceholder}
                    value={data.sagraName}
                    onChange={(e) => update("sagraName", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goNext()}
                    aria-invalid={!!errors.sagraName}
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {data.sagraName.length} / {SAGRA_NAME_MAX}
                  </p>
                </Field>
              </StepLayout>
            )}

            {step === "account" && (
              <StepLayout title={t.setup.accountTitle} description={t.setup.accountDescription}>
                <Field label={t.setup.usernameLabel} htmlFor="setup-username" error={errors.username}>
                  <Input
                    id="setup-username"
                    autoFocus
                    autoComplete="username"
                    className="h-11"
                    maxLength={100}
                    value={data.username}
                    onChange={(e) => update("username", e.target.value)}
                    aria-invalid={!!errors.username}
                  />
                </Field>
                <Field label={t.setup.passwordLabel} htmlFor="setup-password" error={errors.password}>
                  <div className="flex gap-2">
                    <Input
                      id="setup-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="h-11"
                      maxLength={100}
                      value={data.password}
                      onChange={(e) => update("password", e.target.value)}
                      aria-invalid={!!errors.password}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 px-4"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? t.setup.hide : t.setup.show}
                    </Button>
                  </div>
                </Field>
                <Field label={t.setup.confirmPasswordLabel} htmlFor="setup-confirm" error={errors.confirmPassword}>
                  <Input
                    id="setup-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="h-11"
                    maxLength={100}
                    value={data.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goNext()}
                    aria-invalid={!!errors.confirmPassword}
                  />
                </Field>
              </StepLayout>
            )}

            {step === "cashier" && (
              <SetupCashierStep
                settings={data.settings}
                errors={errors}
                onChange={(settings) => {
                  setData((prev) => ({ ...prev, settings }));
                  setErrors({});
                }}
              />
            )}

            {step === "summary" && (
              <SetupSummaryStep
                data={data}
                onEdit={(target) => setStep(target)}
              />
            )}

            {/* ── Navigation ── */}
            <div className="mt-8 flex items-center gap-4">
              {step === "summary" ? (
                <Button className="h-11 px-6 font-semibold" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {isSubmitting ? t.setup.submitting : t.setup.submit}
                </Button>
              ) : (
                <Button className="h-11 px-6 font-semibold" onClick={goNext}>
                  {t.setup.continue}
                </Button>
              )}
              {stepIndex > 0 && (
                <Button variant="ghost" className="h-11" onClick={goBack} disabled={isSubmitting}>
                  {t.setup.back}
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-4 right-4">
        <SetupLanguageSwitcher />
      </div>
    </div>
  );
}

function StepLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export type { Step as SetupStep };
