"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  MonitorIcon,
  SmartphoneIcon,
  ShieldXIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserIcon,
  KeyRoundIcon,
  Loader2Icon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { patchUser } from "@/actions/users";
import { revokeSession } from "@/actions/auth";
import { Session } from "@/lib/api-types";
import { useLocale } from "@/contexts/locale-context";

interface SettingsContentProps {
  userId: string;
  currentUsername: string;
  currentRoleId: string;
  initialSessions: Session[];
  currentSessionId: string;
}

type SettingsTab = "account" | "sessions";

function getSessionStatus(session: Session): "active" | "revoked" | "expired" {
  if (session.revokedAt) return "revoked";
  if (new Date(session.expiresAt) < new Date()) return "expired";
  return "active";
}

function parseUserAgent(ua: string | null): { browser: string | null; os: string | null; isMobile: boolean } {
  if (!ua) return { browser: null, os: null, isMobile: false };
  const mobile = /mobile|android|iphone|ipad/i.test(ua);
  const edgeMatch = ua.match(/Edg(?:e)?\/[\d.]+/);
  const chromeMatch = ua.match(/Chrome\/([\d.]+)/);
  const firefoxMatch = ua.match(/Firefox\/([\d.]+)/);
  const safariMatch = ua.match(/Version\/([\d.]+).*Safari/);
  let browser: string | null = null;
  if (edgeMatch) browser = `Edge ${edgeMatch[0].split("/")[1]?.split(".")[0]}`;
  else if (chromeMatch) browser = `Chrome ${chromeMatch[1]?.split(".")[0]}`;
  else if (firefoxMatch) browser = `Firefox ${firefoxMatch[1]?.split(".")[0]}`;
  else if (safariMatch) browser = `Safari ${safariMatch[1]?.split(".")[0]}`;
  const os =
    ua.includes("Windows NT") ? "Windows" :
    ua.includes("Macintosh") ? "macOS" :
    ua.includes("Android") ? "Android" :
    ua.includes("iPhone") ? "iPhone" :
    ua.includes("iPad") ? "iPad" :
    ua.includes("Linux") ? "Linux" : null;
  return { browser, os, isMobile: mobile };
}

export function SettingsContent({
  userId,
  currentUsername,
  currentRoleId,
  initialSessions,
  currentSessionId,
}: SettingsContentProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingUsername, startUsernameTransition] = useTransition();
  const [pendingPassword, startPasswordTransition] = useTransition();

  const usernameSchema = z.object({
    username: z.string().min(4, t.settings.usernameMin),
  });
  const passwordSchema = z
    .object({
      password: z.string().min(8, t.settings.passwordMin),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t.settings.passwordMismatch,
      path: ["confirmPassword"],
    });

  type UsernameForm = z.infer<typeof usernameSchema>;
  type PasswordForm = z.infer<typeof passwordSchema>;

  const usernameForm = useForm<UsernameForm>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: currentUsername },
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  function onSubmitUsername(values: UsernameForm) {
    startUsernameTransition(async () => {
      const result = await patchUser(userId, { username: values.username });
      if (!result.ok) {
        toast.error(result.error || t.settings.toastErrorSave);
        return;
      }
      toast.success(t.settings.toastUsernameUpdated);
      setTimeout(() => router.push("/api/auth/force-logout"), 1500);
    });
  }

  function onSubmitPassword(values: PasswordForm) {
    startPasswordTransition(async () => {
      const result = await patchUser(userId, { password: values.password });
      if (!result.ok) {
        toast.error(result.error || t.settings.toastErrorSave);
        return;
      }
      toast.success(t.settings.toastPasswordUpdated);
      setTimeout(() => router.push("/api/auth/force-logout"), 1500);
    });
  }

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    const result = await revokeSession(sessionId);
    setRevokingId(null);
    if (!result.ok) {
      toast.error(result.error || t.settings.toastErrorRevoke);
      return;
    }
    toast.success(t.settings.toastRevoked);
    setSessions((prev) =>
      prev.map((s) =>
        s.sessionId === sessionId ? { ...s, revokedAt: new Date().toISOString() } : s
      )
    );
  }

  async function handleRevokeAll() {
    const active = sessions.filter((s) => getSessionStatus(s) === "active");
    if (!active.length) return;
    setRevokingAll(true);
    await Promise.all(active.map((s) => revokeSession(s.sessionId)));
    setRevokingAll(false);
    toast.success(t.settings.toastRevoked);
    setSessions((prev) =>
      prev.map((s) =>
        getSessionStatus(s) === "active" ? { ...s, revokedAt: new Date().toISOString() } : s
      )
    );
  }

  const activeSessions = sessions.filter((s) => getSessionStatus(s) === "active");
  const inactiveSessions = sessions.filter((s) => getSessionStatus(s) !== "active");

  const navItems: { id: SettingsTab; icon: React.ElementType; label: string }[] = [
    { id: "account", icon: UserIcon, label: t.settings.tabAccount },
    { id: "sessions", icon: ShieldCheckIcon, label: t.settings.tabSessions },
  ];

  return (
    <div className="flex flex-1 flex-col lg:flex-row gap-0 p-4 pt-0 min-h-0">

      {/* ─── Nav — horizontal pills until lg, vertical list on lg+ ── */}
      <nav className="lg:w-48 shrink-0 lg:pr-4">
        {/* Compact: horizontal pill tabs */}
        <div className="flex lg:hidden gap-1 mb-4 rounded-lg bg-muted p-1">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Desktop: vertical list */}
        <ul className="hidden lg:flex flex-col space-y-1">
          {navItems.map(({ id, icon: Icon, label }) => (
            <li key={id}>
              <button
                onClick={() => setActiveTab(id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  activeTab === id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <Separator orientation="vertical" className="hidden lg:block self-stretch" />
      <Separator className="lg:hidden mb-4" />

      {/* ─── Content ──────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-6 min-w-0">

        {/* Account */}
        {activeTab === "account" && (
          <div className="w-full flex justify-center">
          <div className="w-full max-w-xl space-y-6">
            <div>
              <h2 className="text-base font-semibold">{t.settings.accountTitle}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t.settings.accountDescription}</p>
            </div>

            {/* Username form */}
            <form onSubmit={usernameForm.handleSubmit(onSubmitUsername)} className="space-y-0">
              <div className="rounded-xl border bg-card divide-y">
                <div className="px-5 py-4 space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-1.5 text-sm font-medium">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    {t.settings.usernameLabel}
                  </Label>
                  <Input
                    id="username"
                    placeholder={t.settings.usernamePlaceholder}
                    className="bg-background"
                    {...usernameForm.register("username")}
                  />
                  {usernameForm.formState.errors.username && (
                    <p className="text-xs text-destructive">{usernameForm.formState.errors.username.message}</p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={pendingUsername} className="w-full gap-2 mt-3 h-11">
                {pendingUsername
                  ? <Loader2Icon className="size-4 animate-spin" />
                  : <UserIcon className="size-4" />}
                {pendingUsername ? t.settings.saving : t.settings.saveUsername}
              </Button>
            </form>

            {/* Password form */}
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-0">
              <div className="rounded-xl border bg-card divide-y">
                <div className="px-5 py-4 space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-1.5 text-sm font-medium">
                    <KeyRoundIcon className="size-3.5 text-muted-foreground" />
                    {t.settings.passwordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t.settings.passwordPlaceholder}
                      className="bg-background pr-10"
                      {...passwordForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="px-5 py-4 space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    {t.settings.confirmPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t.settings.confirmPasswordPlaceholder}
                      className="bg-background pr-10"
                      {...passwordForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={pendingPassword} className="w-full gap-2 mt-3 h-11">
                {pendingPassword
                  ? <Loader2Icon className="size-4 animate-spin" />
                  : <KeyRoundIcon className="size-4" />}
                {pendingPassword ? t.settings.saving : t.settings.savePassword}
              </Button>
            </form>
          </div>
          </div>
        )}

        {/* Sessions */}
        {activeTab === "sessions" && (
          <div className="w-full flex justify-center">
          <div className="space-y-4 w-full max-w-2xl">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-semibold">{t.settings.sessionsTitle}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t.settings.sessionsDescription}</p>
              </div>
              {activeSessions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5 shrink-0"
                  disabled={revokingAll}
                  onClick={handleRevokeAll}
                >
                  {revokingAll
                    ? <Loader2Icon className="size-3.5 animate-spin" />
                    : <ShieldXIcon className="size-3.5" />}
                  {t.settings.revokeAllButton}
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              <StatChip icon={CheckCircle2Icon} value={activeSessions.length} label={t.settings.sessionActive} color="emerald" />
              {inactiveSessions.length > 0 && (
                <StatChip icon={XCircleIcon} value={inactiveSessions.length} label={t.settings.sessionRevoked} color="slate" />
              )}
            </div>

            {sessions.length === 0 ? (
              <EmptyState label={t.settings.noSessions} />
            ) : (
              <div className="space-y-2">
                {/* Active sessions */}
                {activeSessions.length === 0 && (
                  <EmptyState label={t.settings.noSessions} />
                )}
                {activeSessions.map((s) => (
                  <SessionCard
                    key={s.sessionId}
                    session={s}
                    status="active"
                    isCurrent={s.sessionId === currentSessionId}
                    revoking={revokingId === s.sessionId}
                    onRevoke={handleRevoke}
                    t={t.settings}
                  />
                ))}

                {/* Inactive collapsible */}
                {inactiveSessions.length > 0 && (
                  <div className="pt-1">
                    <button
                      onClick={() => setInactiveOpen((v) => !v)}
                      className="flex w-full items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Separator className="flex-1" />
                      <span className="shrink-0 flex items-center gap-1.5">
                        {inactiveSessions.length} inattive
                        <ChevronDownIcon
                          className={cn("size-3.5 transition-transform", inactiveOpen && "rotate-180")}
                        />
                      </span>
                      <Separator className="flex-1" />
                    </button>

                    {inactiveOpen && (
                      <div className="space-y-2 mt-2">
                        {inactiveSessions.map((s) => (
                          <SessionCard
                            key={s.sessionId}
                            session={s}
                            status={getSessionStatus(s)}
                            isCurrent={false}
                            revoking={false}
                            onRevoke={handleRevoke}
                            t={t.settings}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────── */

function StatChip({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  color: "emerald" | "slate";
}) {
  const colors = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    slate: "bg-muted/60 text-muted-foreground border-border",
  };
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2", colors[color])}>
      <Icon className="size-3.5" />
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
      <ShieldCheckIcon className="size-7 text-muted-foreground/40 mb-2" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function SessionCard({
  session,
  status,
  isCurrent,
  revoking,
  onRevoke,
  t,
}: {
  session: Session;
  status: "active" | "revoked" | "expired";
  isCurrent: boolean;
  revoking: boolean;
  onRevoke: (id: string) => void;
  t: Record<string, string>;
}) {
  const { browser, os, isMobile } = parseUserAgent(session.userAgent);
  const DeviceIcon = isMobile ? SmartphoneIcon : MonitorIcon;
  const isActive = status === "active";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3 transition-colors lg:flex-row lg:items-center",
        isActive ? "bg-card" : "bg-muted/30 opacity-60",
        isCurrent && "border-primary/40 ring-1 ring-primary/20"
      )}
    >
      {/* Device icon + info */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <DeviceIcon className="size-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium truncate">{browser ?? t.unknownDevice}</p>
            {os && <span className="text-xs text-muted-foreground shrink-0">· {os}</span>}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
            <span className="whitespace-nowrap">{t.sessionCreatedAt}: {format(new Date(session.createdAt), "dd/MM/yy HH:mm")}</span>
            {isActive && (
              <span className="whitespace-nowrap">{t.sessionExpiresAt}: {format(new Date(session.expiresAt), "dd/MM/yy HH:mm")}</span>
            )}
            {status === "revoked" && session.revokedAt && (
              <span className="whitespace-nowrap">{t.sessionRevokedAt}: {format(new Date(session.revokedAt), "dd/MM/yy HH:mm")}</span>
            )}
          </div>
        </div>
      </div>

      {/* Status + revoke — wraps below info on mobile, inline on sm+ */}
      <div className="flex items-center gap-2 flex-wrap shrink-0 pl-12 lg:pl-0">
        {isCurrent && (
          <Badge variant="outline" className="gap-1 text-primary border-primary/30 bg-primary/5 text-xs whitespace-nowrap">
            <CheckCircle2Icon className="size-3" />
            {t.sessionCurrent}
          </Badge>
        )}
        <SessionBadge status={status} t={t} />
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto lg:ml-0"
            disabled={revoking}
            onClick={() => onRevoke(session.sessionId)}
            title={t.revokeButton}
          >
            {revoking
              ? <Loader2Icon className="size-3.5 animate-spin" />
              : <ShieldXIcon className="size-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function SessionBadge({
  status,
  t,
}: {
  status: "active" | "revoked" | "expired";
  t: Record<string, string>;
}) {
  if (status === "active") {
    return (
      <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400 text-xs whitespace-nowrap">
        <CheckCircle2Icon className="size-3" />
        {t.sessionActive}
      </Badge>
    );
  }
  if (status === "revoked") {
    return (
      <Badge variant="outline" className="gap-1 text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 text-xs whitespace-nowrap">
        <XCircleIcon className="size-3" />
        {t.sessionRevoked}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground text-xs whitespace-nowrap">
      <ClockIcon className="size-3" />
      {t.sessionExpired}
    </Badge>
  );
}
