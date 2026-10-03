"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  Trash2Icon,
  UnderlineIcon,
  XIcon,
} from "lucide-react";
import { OrderInstruction } from "@/lib/api-types";
import { createOrderInstruction, updateOrderInstruction } from "@/actions/order-instructions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { fill } from "@/components/dashboard/menu/menu-utils";
import { htmlToMarkdown, markdownToHtml } from "./customer-app-utils";

export interface InstructionEditorProps {
  /** null = nuova istruzione */
  instruction: OrderInstruction | null;
  /** Numero del passo mostrato ai clienti (1, 2, ...) */
  stepNumber: number;
  nextPosition: number;
  canEdit: boolean;
  canDelete: boolean;
  showHeader?: boolean;
  onSaved: (instruction: OrderInstruction, isNew: boolean) => void;
  onDeleteRequest: (instruction: OrderInstruction) => void;
  /** force = salta il controllo delle modifiche non salvate */
  onClose: (force?: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onDraftChange: (text: string) => void;
}

export function InstructionEditor({
  instruction,
  stepNumber,
  nextPosition,
  canEdit,
  canDelete,
  showHeader,
  onSaved,
  onDeleteRequest,
  onClose,
  onDirtyChange,
  onDraftChange,
}: InstructionEditorProps) {
  const { t } = useLocale();
  const [savedText, setSavedText] = useState(instruction?.text ?? "");
  const [text, setText] = useState(savedText);
  // Cambia a ogni annullamento: l'editor riparte dal testo salvato
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dirty = text !== savedText;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  useEffect(() => {
    onDraftChange(text);
  }, [text, onDraftChange]);

  function discardChanges() {
    setText(savedText);
    setError("");
    setResetKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError(t.customerApp.instructionRequired);
      return;
    }
    setError("");
    setIsSubmitting(true);
    const result = instruction
      ? await updateOrderInstruction(instruction.id, { text: trimmed })
      : await createOrderInstruction({ text: trimmed, position: nextPosition });
    setIsSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(instruction ? t.orderInstructions.toastUpdated : t.orderInstructions.toastCreated);
    setSavedText(result.data.text);
    setText(result.data.text);
    onSaved(result.data, !instruction);
  }

  const title = fill(t.customerApp.stepLabel, { n: stepNumber });

  return (
    <form onSubmit={handleSubmit} className="@container flex h-full min-h-0 flex-col" noValidate>
      {showHeader && (
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold">
            {instruction ? title : t.customerApp.newInstruction}
          </h2>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onClose()} aria-label={t.customerApp.close}>
            <XIcon />
          </Button>
        </div>
      )}

      <fieldset
        disabled={!canEdit || isSubmitting}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 @sm:p-5"
      >
        {!canEdit && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {t.customerApp.readOnlyNotice}
          </p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-baseline gap-1.5">
            <Label htmlFor="instruction-text">{title}</Label>
            <span className="text-xs text-muted-foreground">· {t.customerApp.instructionHint}</span>
          </div>
          <RichTextEditor
            key={resetKey}
            id="instruction-text"
            value={text}
            placeholder={t.customerApp.instructionPlaceholder}
            invalid={!!error}
            disabled={!canEdit}
            autoFocus={!instruction}
            onChange={(md) => {
              setText(md);
              if (md.trim()) setError("");
            }}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </fieldset>

      {canEdit && (
        <div className="flex items-center gap-2 border-t px-4 py-3">
          <div className="mr-auto">
            {instruction ? (
              canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDeleteRequest(instruction)}
                >
                  <Trash2Icon />
                  {t.common.delete}
                </Button>
              )
            ) : (
              <Button type="button" variant="ghost" onClick={() => onClose(true)}>
                {t.common.cancel}
              </Button>
            )}
          </div>
          {instruction && dirty && (
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={discardChanges}>
              {t.customerApp.discardChanges}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || (!!instruction && !dirty)}>
            {isSubmitting
              ? t.orderInstructions.saving
              : instruction
                ? t.common.save
                : t.customerApp.createInstruction}
          </Button>
        </div>
      )}
    </form>
  );
}

// ── Editor di testo con grassetto, corsivo, barrato e sottolineato ────

function RichTextEditor({
  id,
  value,
  placeholder,
  invalid,
  disabled,
  autoFocus,
  onChange,
}: {
  id: string;
  value: string;
  placeholder: string;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (markdown: string) => void;
}) {
  const { t } = useLocale();
  const editorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});

  // Il contenuto iniziale si scrive una volta sola: dopo è il DOM a comandare
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = markdownToHtml(value);
    if (autoFocus) editorRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateActive = useCallback(() => {
    if (!editorRef.current?.contains(document.getSelection()?.anchorNode ?? null)) return;
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      underline: document.queryCommandState("underline"),
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActive);
    return () => document.removeEventListener("selectionchange", updateActive);
  }, [updateActive]);

  function emit() {
    if (editorRef.current) onChange(htmlToMarkdown(editorRef.current.innerHTML));
  }

  function format(command: string) {
    document.execCommand(command);
    editorRef.current?.focus();
    emit();
    updateActive();
  }

  const buttons = [
    { command: "bold", icon: BoldIcon, label: t.customerApp.formatBold, key: "b" },
    { command: "italic", icon: ItalicIcon, label: t.customerApp.formatItalic, key: "i" },
    { command: "strikeThrough", icon: StrikethroughIcon, label: t.customerApp.formatStrike, key: "d" },
    { command: "underline", icon: UnderlineIcon, label: t.customerApp.formatUnderline, key: "u" },
  ];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        invalid && "border-destructive ring-3 ring-destructive/20",
        disabled && "opacity-60"
      )}
    >
      <div className="flex items-center gap-0.5 border-b bg-muted/40 p-1">
        {buttons.map(({ command, icon: Icon, label, key }) => (
          <Tooltip key={command}>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                onMouseDown={(e) => {
                  e.preventDefault();
                  format(command);
                }}
                aria-label={label}
                aria-pressed={!!active[command]}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  active[command]
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {label} <span className="ml-1 opacity-70">Ctrl+{key.toUpperCase()}</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          id={id}
          role="textbox"
          aria-multiline="true"
          aria-invalid={invalid}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emit}
          onPaste={(e) => {
            // Solo testo: la formattazione incollata non è rappresentabile
            e.preventDefault();
            document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
          }}
          onKeyDown={(e) => {
            if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
            const button = buttons.find((b) => b.key === e.key.toLowerCase());
            if (!button) return;
            e.preventDefault();
            format(button.command);
          }}
          className="min-h-32 px-3 py-2.5 text-sm leading-relaxed outline-none [&_s]:line-through [&_u]:underline"
        />
        {!value && (
          <div className="pointer-events-none absolute inset-x-0 top-0 px-3 py-2.5 text-sm text-muted-foreground select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
