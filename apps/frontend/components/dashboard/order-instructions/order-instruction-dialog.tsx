"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { OrderInstruction } from "@/lib/api-types";
import { createOrderInstruction, updateOrderInstruction } from "@/actions/order-instructions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2Icon,
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";

// ── Markdown ↔ HTML conversion ────────────────────────────────────────────

function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");
  html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");
  html = html.replace(/__(.+?)__/g, "<u>$1</u>");
  html = html.replace(/\n/g, "<br>");

  return html;
}

function htmlToMarkdown(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(walk).join("");

    switch (tag) {
      case "b":
      case "strong":
        return `**${inner}**`;
      case "i":
      case "em":
        return `*${inner}*`;
      case "s":
      case "strike":
        return `~~${inner}~~`;
      case "u":
        return `__${inner}__`;
      case "br":
        return "\n";
      case "div":
      case "p":
        return inner + "\n";
      default:
        return inner;
    }
  }

  return Array.from(div.childNodes)
    .map(walk)
    .join("")
    .replace(/\n+$/, "");
}

// ── WYSIWYG Editor ────────────────────────────────────────────────────────

function WysiwygEditor({
  value,
  onChange,
  placeholder,
  isDialogOpen,
}: {
  value: string;
  onChange: (markdown: string) => void;
  placeholder: string;
  isDialogOpen?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const html = markdownToHtml(value);
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  function handleInput() {
    if (!editorRef.current) return;
    isInternalChange.current = true;
    const md = htmlToMarkdown(editorRef.current.innerHTML);
    onChange(md);
  }

  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      strikethrough: document.queryCommandState("strikethrough"),
      underline: document.queryCommandState("underline"),
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () => document.removeEventListener("selectionchange", updateActiveFormats);
  }, [updateActiveFormats]);

  function execFormat(command: string, val?: string) {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
    updateActiveFormats();
  }

  function handleBold() {
    execFormat("bold");
  }

  function handleItalic() {
    execFormat("italic");
  }

  function handleStrikethrough() {
    execFormat("strikethrough");
  }

  function handleUnderline() {
    execFormat("underline");
  }

  // ── Event handlers ────────────────────────────────────────────────────

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      if (e.key === "b" && isDialogOpen) {
        e.preventDefault();
        handleBold();
      } else if (e.key === "i") {
        e.preventDefault();
        handleItalic();
      } else if (e.key === "d") {
        e.preventDefault();
        handleStrikethrough();
      } else if (e.key === "u") {
        e.preventDefault();
        handleUnderline();
      }
    }
  }

  const formatButtons = [
    { icon: BoldIcon, label: "Bold", action: handleBold, active: activeFormats.bold, shortcut: "Ctrl+B" },
    { icon: ItalicIcon, label: "Italic", action: handleItalic, active: activeFormats.italic, shortcut: "Ctrl+I" },
    { icon: StrikethroughIcon, label: "Strikethrough", action: handleStrikethrough, active: activeFormats.strikethrough, shortcut: "Ctrl+D" },
    { icon: UnderlineIcon, label: "Underline", action: handleUnderline, active: activeFormats.underline, shortcut: "Ctrl+U" },
  ];

  const isEmpty = !value;

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-muted/40 w-fit">
        {formatButtons.map(({ icon: Icon, label, action, active, shortcut }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  action();
                }}
                className={`p-1.5 rounded-sm transition-all ${
                  active
                    ? "bg-foreground/10 text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:shadow-sm hover:text-foreground"
                }`}
                aria-label={label}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {label} <span className="text-xs opacity-75 ml-1">({shortcut})</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* ── Editor area ── */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyUp={updateActiveFormats}
          onKeyDown={handleKeyDown}
          className="min-h-[6.5rem] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_s]:line-through [&_u]:underline"
          role="textbox"
          aria-multiline="true"
        />
        {isEmpty && (
          <div className="absolute top-0 left-0 px-3 py-2 text-sm text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dialog ────────────────────────────────────────────────────────────────

interface OrderInstructionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instruction: OrderInstruction | null;
  onSaved: (instruction: OrderInstruction) => void;
  onDelete?: (instruction: OrderInstruction) => void;
  instructionsCount?: number;
}

export function OrderInstructionDialog({
  open,
  onOpenChange,
  instruction,
  onSaved,
  onDelete,
  instructionsCount = 0,
}: OrderInstructionDialogProps) {
  const { t } = useLocale();
  const isEditing = !!instruction;
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setText(instruction?.text ?? "");
      setError("");
    }
  }, [instruction, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = text.trim();
    if (!trimmed) {
      setError(t.orderInstructions.textRequired);
      return;
    }
    setError("");
    setIsSubmitting(true);

    if (isEditing && instruction) {
      const result = await updateOrderInstruction(instruction.id, { text: trimmed });
      setIsSubmitting(false);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(t.orderInstructions.toastUpdated);
      onSaved(result.data);
    } else {
      const result = await createOrderInstruction({ text: trimmed, position: instructionsCount });
      setIsSubmitting(false);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(t.orderInstructions.toastCreated);
      onSaved(result.data);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl select-none">
            {isEditing ? t.orderInstructions.editTitle : t.orderInstructions.newTitle}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor="text" required>{t.orderInstructions.textLabel}</FieldLabel>
              <WysiwygEditor
                value={text}
                onChange={(md) => { setText(md); if (md.trim()) setError(""); }}
                placeholder={t.orderInstructions.textPlaceholder}
                isDialogOpen={open}
              />
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter>
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => { onDelete!(instruction!); onOpenChange(false); }}
                className="mr-auto"
              >
                <Trash2Icon className="h-4 w-4 mr-2" />
                {t.common.delete}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t.orderInstructions.saving
                : isEditing
                  ? t.common.save
                  : t.orderInstructions.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
