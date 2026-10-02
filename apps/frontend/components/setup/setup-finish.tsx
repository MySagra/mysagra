"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

const TASK_INTERVAL_MS = 1000;

// Waiting screen. The setup is a single request, so the tasks only pace the wait:
// the last one keeps spinning until the response arrives (`finished`), then all are checked.
export function SetupCreating({ sagraName, finished }: { sagraName: string; finished: boolean }) {
  const { t } = useLocale();
  const tasks = [t.setup.creatingTaskSagra, t.setup.creatingTaskSettings, t.setup.creatingTaskAccount];
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (completed >= tasks.length - 1) return;
    const timer = setTimeout(() => setCompleted((c) => c + 1), TASK_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [completed, tasks.length]);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 pt-12 text-center" role="status" aria-live="polite">
      <div className="relative flex size-28 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-4 border-muted" />
        <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary motion-safe:animate-spin" />
        <img src="/logo.svg" alt="" className="h-14 w-auto motion-safe:animate-pulse" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.setup.creatingTitle}</h1>
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{sagraName}</span> · {t.setup.creatingDescription}
        </p>
      </div>

      <ul className="w-full space-y-2 text-left">
        {tasks.map((task, index) => {
          const isDone = finished || index < completed;
          return (
            <li
              key={task}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 120}ms`, animationFillMode: "both" }}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="size-3.5 motion-safe:animate-in motion-safe:zoom-in-50" /> : <Loader2 className="size-3.5 animate-spin" />}
              </span>
              <span className={cn("transition-colors", isDone ? "text-foreground" : "text-muted-foreground")}>{task}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Confetti pieces: direction (x, y in px), delay and shape, spread around the check mark
const CONFETTI = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const distance = 90 + (i % 3) * 22;
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
    delay: (i % 4) * 40,
    round: i % 2 === 0,
  };
});

export function SetupDone({ sagraName, onStart }: { sagraName: string; onStart: () => Promise<boolean> }) {
  const { t } = useLocale();
  const [starting, setStarting] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);

  async function handleStart() {
    if (loginFailed) {
      window.location.href = "/login";
      return;
    }
    setStarting(true);
    const ok = await onStart();
    if (!ok) {
      setLoginFailed(true);
      setStarting(false);
    }
  }

  // staggered entrance for the texts and the button
  const enter = (delay: number) => ({
    className: "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500",
    style: { animationDelay: `${delay}ms`, animationFillMode: "both" as const },
  });

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 pt-12 text-center">
      <div className="relative flex size-28 items-center justify-center">
        {/* expanding rings */}
        <span className="absolute inset-0 rounded-full bg-primary/25 motion-safe:animate-[setup-ring_1.2s_ease-out_forwards]" />
        <span
          className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-[setup-ring_1.2s_ease-out_forwards]"
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        />

        {/* confetti burst */}
        {CONFETTI.map((piece, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "absolute left-1/2 top-1/2 size-2 opacity-0 motion-safe:animate-[setup-confetti_900ms_ease-out_forwards]",
              piece.round ? "rounded-full bg-primary" : "rotate-45 bg-amber-500"
            )}
            style={
              {
                "--setup-x": `${piece.x}px`,
                "--setup-y": `${piece.y}px`,
                animationDelay: `${150 + piece.delay}ms`,
              } as React.CSSProperties
            }
          />
        ))}

        {/* check mark */}
        <span className="relative flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500">
          <Check className="size-12" strokeWidth={3} />
        </span>
      </div>

      <div className="space-y-3">
        <h1 {...enter(350)} className={cn(enter(350).className, "text-4xl font-bold tracking-tight")}>
          {t.setup.doneTitle.replace("{name}", sagraName)}
        </h1>
        <p {...enter(500)} className={cn(enter(500).className, "text-muted-foreground")}>
          {loginFailed ? t.setup.doneLoginFailed : t.setup.doneDescription}
        </p>
      </div>

      <div {...enter(700)}>
        <Button
          size="lg"
          className="h-12 gap-2 px-8 text-base font-semibold"
          onClick={handleStart}
          disabled={starting}
          autoFocus
        >
          {loginFailed ? t.setup.goToLogin : t.setup.start}
          {starting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
