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
  CodeIcon,
  LinkIcon,
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

  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");
  html = html.replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
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
      case "code":
        return `\`${inner}\``;
      case "a": {
        const href = el.getAttribute("href") || "";
        return `[${inner}](${href})`;
      }
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
}: {
  value: string;
  onChange: (markdown: string) => void;
  placeholder: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const linkAnchorRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const isInternalChange = useRef(false);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);

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

  function handleCode() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    let codeParent: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
    if (codeParent.nodeType === Node.TEXT_NODE) codeParent = codeParent.parentElement;
    while (codeParent && codeParent !== editorRef.current) {
      if (codeParent.tagName?.toLowerCase() === "code") {
        const textNode = document.createTextNode(codeParent.textContent || "");
        codeParent.parentNode?.replaceChild(textNode, codeParent);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(textNode);
        selection.addRange(newRange);
        handleInput();
        return;
      }
      codeParent = codeParent.parentElement;
    }

    const selectedText = selection.toString();
    const code = document.createElement("code");
    code.className = "bg-muted px-1 py-0.5 rounded text-xs font-mono";
    code.textContent = selectedText || "code";

    range.deleteContents();
    range.insertNode(code);

    const afterRange = document.createRange();
    afterRange.setStartAfter(code);
    afterRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(afterRange);

    handleInput();
  }

  // ── Link popover logic ────────────────────────────────────────────────

  function saveSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const selection = window.getSelection();
    if (savedSelectionRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    }
  }

  function positionLinkAnchor() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !wrapperRef.current || !linkAnchorRef.current) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const wrapperRect = wrapperRef.current.getBoundingClientRect();

    linkAnchorRef.current.style.left = `${Math.max(0, rect.left - wrapperRect.left + rect.width / 2)}px`;
    linkAnchorRef.current.style.top = `${Math.max(0, rect.top - wrapperRect.top)}px`;
  }

  function handleLinkClick() {
    saveSelection();
    positionLinkAnchor();
    setLinkUrl("");
    setLinkPopoverOpen(true);

    // Focus the input after popover opens
    requestAnimationFrame(() => {
      linkInputRef.current?.focus();
    });
  }

  function handleLinkConfirm() {
    const url = linkUrl.trim();
    setLinkPopoverOpen(false);
    if (!url) return;

    restoreSelection();
    editorRef.current?.focus();

    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";

    if (selectedText) {
      document.execCommand("createLink", false, url);
      handleInput();
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "link";

      const range = selection?.getRangeAt(0);
      if (range) {
        range.insertNode(link);
        range.setStartAfter(link);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      handleInput();
    }
  }

  function handleLinkUrlPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text/plain").trim();
    if (pasted.match(/^https?:\/\//)) {
      e.preventDefault();
      setLinkUrl(pasted);
    }
  }

  // ── Event handlers ────────────────────────────────────────────────────

  function handleClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === "a") {
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  const isCodeActive = (() => {
    try {
      const selection = typeof window !== "undefined" ? window.getSelection() : null;
      if (!selection || selection.rangeCount === 0) return false;
      let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editorRef.current) {
        if ((node as HTMLElement).tagName?.toLowerCase() === "code") return true;
        node = node.parentNode;
      }
      return false;
    } catch {
      return false;
    }
  })();

  const formatButtons = [
    { icon: BoldIcon, label: "Bold", action: handleBold, active: activeFormats.bold },
    { icon: ItalicIcon, label: "Italic", action: handleItalic, active: activeFormats.italic },
    { icon: CodeIcon, label: "Code", action: handleCode, active: isCodeActive },
  ];

  const isEmpty = !value;

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-muted/40 w-fit">
        {formatButtons.map(({ icon: Icon, label, action, active }) => (
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
              {label}
            </TooltipContent>
          </Tooltip>
        ))}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleLinkClick();
              }}
              className="p-1.5 rounded-sm transition-all text-muted-foreground hover:bg-background hover:shadow-sm hover:text-foreground"
              aria-label="Link"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Link
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ── Editor area ── */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onClick={handleClick}
          onPaste={handlePaste}
          onKeyUp={updateActiveFormats}
          className="min-h-[6.5rem] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_a]:underline [&_a]:text-primary [&_a]:hover:text-primary/80 [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono"
          role="textbox"
          aria-multiline="true"
        />
        {isEmpty && (
          <div className="absolute top-0 left-0 px-3 py-2 text-sm text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </div>
        )}

        {/* Link popover — anchored at the selection position */}
        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen} modal>
          <PopoverTrigger asChild>
            <div
              ref={linkAnchorRef}
              className="absolute w-px h-px"
              style={{ left: 0, top: 0, pointerEvents: "none" }}
              aria-hidden
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-72 p-3"
            side="top"
            align="center"
            sideOffset={8}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              requestAnimationFrame(() => linkInputRef.current?.focus());
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">URL</label>
              <Input
                ref={linkInputRef}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onPaste={handleLinkUrlPaste}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLinkConfirm();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setLinkPopoverOpen(false);
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setLinkPopoverOpen(false)}
                >
                  Annulla
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleLinkConfirm}
                  disabled={!linkUrl.trim()}
                >
                  Inserisci
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
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

    try {
      let saved: OrderInstruction;

      if (isEditing && instruction) {
        saved = await updateOrderInstruction(instruction.id, { text: trimmed });
        toast.success(t.orderInstructions.toastUpdated);
      } else {
        saved = await createOrderInstruction({ text: trimmed, position: instructionsCount });
        toast.success(t.orderInstructions.toastCreated);
      }

      onSaved(saved);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || t.orderInstructions.toastErrorSave);
    } finally {
      setIsSubmitting(false);
    }
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
