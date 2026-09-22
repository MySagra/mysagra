"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Loader2, Monitor, Printer, Landmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/contexts/locale-context";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import type { CashRegister } from "@/lib/api-types";
import { getCashRegisters } from "@/actions/cash-registers";
import { generalClosure } from "@/actions/reports";

interface GeneralClosureButtonProps {
  className?: string;
  size?: "sm" | "default";
}

/** Button + dialog to print the daily closure. Hidden for roles the endpoint rejects. */
export function GeneralClosureButton({ className, size = "sm" }: GeneralClosureButtonProps) {
  const { t } = useLocale();
  const { isAdmin, isMaintainer } = useRole();
  const [open, setOpen] = useState(false);

  if (!isAdmin && !isMaintainer) return null;

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={() => setOpen(true)}
        className={cn(
          "gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
          className,
        )}
      >
        <Landmark className="h-4 w-4" />
        {t.closure.button}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {/* Mounted only while open: registers are reloaded on every opening */}
          {open && <GeneralClosureForm onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function GeneralClosureForm({ onDone }: { onDone: () => void }) {
  const { t } = useLocale();
  const [registers, setRegisters] = useState<CashRegister[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCashRegisters("printer")
      .then((data) => {
        if (cancelled) return;
        setRegisters(data);
        // Preselect when only one register can print
        const printable = data.filter((r) => r.enabled && r.defaultPrinter);
        if (printable.length === 1) setSelectedId(printable[0].id);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConfirm() {
    if (!selectedId) return;
    setSubmitting(true);
    const result = await generalClosure(selectedId);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error || t.closure.toastError);
      return;
    }
    toast.success(t.closure.toastSuccess);
    onDone();
  }

  return (
    <div className="flex flex-col gap-5">
      <DialogHeader className="flex-row items-start gap-3 space-y-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <Landmark className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <DialogTitle>{t.closure.title}</DialogTitle>
          <DialogDescription>{t.closure.description}</DialogDescription>
        </div>
      </DialogHeader>

      <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>{t.closure.periodNote}</p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.closure.pickPrinter}</p>

        {loadError ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-destructive">
            {t.closure.loadError}
          </p>
        ) : registers === null ? (
          <div className="space-y-2">
            <Skeleton className="h-15 rounded-lg" />
            <Skeleton className="h-15 rounded-lg" />
          </div>
        ) : registers.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {t.closure.noRegisters}
          </p>
        ) : (
          <div role="radiogroup" className="max-h-72 space-y-2 overflow-y-auto">
            {registers.map((register) => {
              const printer = register.defaultPrinter;
              const disabled = !register.enabled || !printer;
              const active = selectedId === register.id;
              return (
                <button
                  key={register.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  onClick={() => setSelectedId(register.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "border-primary/60 bg-primary/10" : "hover:bg-muted/50",
                    disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Printer className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {printer ? printer.name : t.closure.noPrinter}
                      </p>
                      {printer && printer.status !== "ONLINE" && (
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-1.5 py-px text-[10px] font-bold uppercase tracking-wide",
                            printer.status === "ERROR"
                              ? "border-destructive/40 bg-destructive/10 text-destructive"
                              : "border-border bg-muted text-muted-foreground",
                          )}
                        >
                          {printer.status === "ERROR" ? t.closure.statusError : t.closure.statusOffline}
                        </span>
                      )}
                      {!register.enabled && (
                        <span className="shrink-0 rounded-full border border-border bg-muted px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {t.closure.registerDisabled}
                        </span>
                      )}
                    </div>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Monitor className="h-3 w-3 shrink-0" />
                      <span className="truncate">{register.name}</span>
                      {printer?.ip && <span className="font-mono">· {printer.ip}</span>}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {active && <Check className="h-3 w-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          {t.common.cancel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleConfirm}
          disabled={!selectedId || submitting}
          className="gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          {submitting ? t.closure.submitting : t.closure.confirm}
        </Button>
      </DialogFooter>
    </div>
  );
}
