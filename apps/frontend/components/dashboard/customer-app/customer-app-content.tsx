"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, ListOrderedIcon, PlusIcon, type LucideIcon } from "lucide-react";
import { Banner, OrderInstruction } from "@/lib/api-types";
import { reorderBanners } from "@/actions/banners";
import { reorderOrderInstructions } from "@/actions/order-instructions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { fill } from "@/components/dashboard/menu/menu-utils";
import { useLocale } from "@/contexts/locale-context";
import { useTimezone } from "@/contexts/timezone-context";
import { useRole } from "@/hooks/use-role";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SortableList } from "./sortable-list";
import { BannerEditor } from "./banner-editor";
import { InstructionEditor } from "./instruction-editor";
import { DeleteBannerDialog } from "./delete-banner-dialog";
import { DeleteInstructionDialog } from "./delete-instruction-dialog";
import {
  BannerPreview,
  BannerThumb,
  bannerToDraft,
  InstructionsPreview,
  isBannerShown,
  type BannerDraft,
} from "./customer-preview";
import {
  bannerName,
  bannerPayload,
  formatShortDate,
  formatShortDateTime,
  sortByPosition,
  stripMarkdown,
  toZonedInput,
  type CustomerAppTab,
  type PreviewCategory,
} from "./customer-app-utils";

type EditorState = { mode: "edit"; id: string } | { mode: "create" } | null;

/** Sotto questa soglia l'editor non sta accanto alla lista: diventa uno sheet. */
const WIDE_QUERY = "(min-width: 1024px)";

interface CustomerAppContentProps {
  initialTab: CustomerAppTab;
  initialBanners: Banner[];
  initialInstructions: OrderInstruction[];
  /** Categorie disponibili, per il menù nell'anteprima */
  categories: PreviewCategory[];
}

function nextPositionOf(items: { position: number }[]) {
  return items.length ? Math.max(...items.map((i) => i.position)) + 1 : 0;
}

export function CustomerAppContent({
  initialTab,
  initialBanners,
  initialInstructions,
  categories,
}: CustomerAppContentProps) {
  const { t, locale } = useLocale();
  const timezone = useTimezone();
  const { isSessionLoading, canManageBanners, canManageOrderInstructions } = useRole();
  const isWide = useMediaQuery(WIDE_QUERY);

  const [tab, setTab] = useState<CustomerAppTab>(initialTab);
  const [banners, setBanners] = useState(() => sortByPosition(initialBanners));
  const [instructions, setInstructions] = useState(() => sortByPosition(initialInstructions));

  const [bannerEditor, setBannerEditor] = useState<EditorState>(null);
  const [instructionEditor, setInstructionEditor] = useState<EditorState>(null);
  const [bannerDraft, setBannerDraft] = useState<BannerDraft | null>(null);
  const [instructionDraft, setInstructionDraft] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [deletingInstruction, setDeletingInstruction] = useState<OrderInstruction | null>(null);

  const isBanners = tab === "banners";
  const canEdit = !isSessionLoading && (isBanners ? canManageBanners : canManageOrderInstructions);

  const editingBanner =
    bannerEditor?.mode === "edit" ? banners.find((b) => b.id === bannerEditor.id) ?? null : null;
  const editingInstruction =
    instructionEditor?.mode === "edit"
      ? instructions.find((i) => i.id === instructionEditor.id) ?? null
      : null;

  // ── Tab e controllo delle modifiche non salvate ────────────────────
  function changeTab(next: CustomerAppTab) {
    if (next === tab) return;
    guarded(() => switchTab(next));
  }

  function switchTab(next: CustomerAppTab) {
    setTab(next);
    const url = next === "instructions" ? "?tab=instructions" : window.location.pathname;
    window.history.replaceState(null, "", url);
  }

  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  function guarded(action: () => void) {
    if (dirtyRef.current) {
      setPendingNavigation(() => action);
    } else {
      action();
    }
  }

  // ── Banner ─────────────────────────────────────────────────────────
  function openBanner(banner: Banner) {
    if (bannerEditor?.mode === "edit" && bannerEditor.id === banner.id) return;
    guarded(() => setBannerEditor({ mode: "edit", id: banner.id }));
  }

  function openNewBanner() {
    guarded(() => {
      switchTab("banners");
      setBannerEditor({ mode: "create" });
    });
  }

  function closeBannerEditor(force?: boolean) {
    if (force) {
      dirtyRef.current = false;
      setBannerEditor(null);
    } else {
      guarded(() => setBannerEditor(null));
    }
  }

  function handleBannerSaved(saved: Banner, isNew: boolean) {
    dirtyRef.current = false;
    setBanners((prev) => (isNew ? [...prev, saved] : prev.map((b) => (b.id === saved.id ? saved : b))));
    if (isNew) setBannerEditor({ mode: "edit", id: saved.id });
  }

  function handleBannerDeleted(id: string) {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    setDeletingBanner(null);
    if (bannerEditor?.mode === "edit" && bannerEditor.id === id) closeBannerEditor(true);
  }

  async function handleBannerReorder(reordered: Banner[]) {
    const previous = banners;
    const next = reordered.map((b, position) => ({ ...b, position }));
    setBanners(next);
    // Ogni banner spostato è un PUT completo: manda solo quelli cambiati
    const changed = next.filter((b) => previous.find((p) => p.id === b.id)?.position !== b.position);
    try {
      await reorderBanners(changed.map((b) => bannerPayload(b, b.position)));
      toast.success(t.customerApp.orderSaved);
    } catch {
      setBanners(previous);
      toast.error(t.customerApp.orderError);
    }
  }

  function bannerSubtitle(banner: Banner) {
    const now = new Date();
    const type = banner.type === "EVENT" ? t.customerApp.typeEvent : t.customerApp.typeSponsor;
    let detail: string;
    if (banner.type === "SPONSOR") {
      detail =
        new Date(banner.visibleFrom) > now
          ? fill(t.customerApp.visibleFromShort, {
              date: formatShortDate(toZonedInput(banner.visibleFrom, timezone), locale),
            })
          : t.customerApp.alwaysVisible;
    } else if (banner.endsAt && new Date(banner.endsAt) < now) {
      detail = t.customerApp.eventEnded;
    } else if (banner.startsAt) {
      detail = formatShortDateTime(toZonedInput(banner.startsAt, timezone), locale);
    } else {
      detail = t.customerApp.noDate;
    }
    return `${type} · ${detail}`;
  }

  // ── Istruzioni ─────────────────────────────────────────────────────
  function openInstruction(instruction: OrderInstruction) {
    if (instructionEditor?.mode === "edit" && instructionEditor.id === instruction.id) return;
    guarded(() => setInstructionEditor({ mode: "edit", id: instruction.id }));
  }

  function openNewInstruction() {
    guarded(() => {
      switchTab("instructions");
      setInstructionEditor({ mode: "create" });
    });
  }

  function closeInstructionEditor(force?: boolean) {
    if (force) {
      dirtyRef.current = false;
      setInstructionEditor(null);
    } else {
      guarded(() => setInstructionEditor(null));
    }
  }

  function handleInstructionSaved(saved: OrderInstruction, isNew: boolean) {
    dirtyRef.current = false;
    setInstructions((prev) =>
      isNew ? [...prev, saved] : prev.map((i) => (i.id === saved.id ? saved : i))
    );
    if (isNew) setInstructionEditor({ mode: "edit", id: saved.id });
  }

  function handleInstructionDeleted(id: string) {
    setInstructions((prev) => prev.filter((i) => i.id !== id));
    setDeletingInstruction(null);
    if (instructionEditor?.mode === "edit" && instructionEditor.id === id) closeInstructionEditor(true);
  }

  async function handleInstructionReorder(reordered: OrderInstruction[]) {
    const previous = instructions;
    const next = reordered.map((i, position) => ({ ...i, position }));
    setInstructions(next);
    const changed = next.filter((i) => previous.find((p) => p.id === i.id)?.position !== i.position);
    try {
      await reorderOrderInstructions(changed.map(({ id, text, position }) => ({ id, text, position })));
      toast.success(t.customerApp.orderSaved);
    } catch {
      setInstructions(previous);
      toast.error(t.customerApp.orderError);
    }
  }

  // ── Editor e anteprima ─────────────────────────────────────────────
  const editorShowsHeader = !isWide;

  const bannerEditorNode = bannerEditor && (
    <BannerEditor
      key={bannerEditor.mode === "edit" ? bannerEditor.id : "new"}
      banner={editingBanner}
      nextPosition={nextPositionOf(banners)}
      canEdit={!isSessionLoading && canManageBanners}
      canDelete={!isSessionLoading && canManageBanners}
      showHeader={editorShowsHeader}
      onSaved={handleBannerSaved}
      onDeleteRequest={setDeletingBanner}
      onClose={closeBannerEditor}
      onDirtyChange={handleDirtyChange}
      onDraftChange={setBannerDraft}
    />
  );

  const editingInstructionIndex = editingInstruction ? instructions.indexOf(editingInstruction) : -1;

  const instructionEditorNode = instructionEditor && (
    <InstructionEditor
      key={instructionEditor.mode === "edit" ? instructionEditor.id : "new"}
      instruction={editingInstruction}
      stepNumber={editingInstruction ? editingInstructionIndex + 1 : instructions.length + 1}
      nextPosition={nextPositionOf(instructions)}
      canEdit={!isSessionLoading && canManageOrderInstructions}
      canDelete={!isSessionLoading && canManageOrderInstructions}
      showHeader={editorShowsHeader}
      onSaved={handleInstructionSaved}
      onDeleteRequest={setDeletingInstruction}
      onClose={closeInstructionEditor}
      onDirtyChange={handleDirtyChange}
      onDraftChange={setInstructionDraft}
    />
  );

  const panelNode = isBanners ? bannerEditorNode : instructionEditorNode;

  // Carosello come lo vedono i clienti, con il banner in modifica al suo posto
  // (mostrato anche se programmato o concluso, con una nota sotto il telefono)
  const editingBannerId = bannerEditor?.mode === "edit" ? bannerEditor.id : null;
  const liveDraft =
    bannerDraft && bannerEditor && bannerDraft.id === editingBannerId ? bannerDraft : null;
  const slides: BannerDraft[] = [];
  let slideIndex = 0;
  for (const banner of banners) {
    if (banner.id === editingBannerId && liveDraft) {
      slideIndex = slides.length;
      slides.push(liveDraft);
      continue;
    }
    const draft = bannerToDraft(banner);
    if (isBannerShown(draft)) slides.push(draft);
  }
  if (bannerEditor?.mode === "create" && liveDraft) {
    slideIndex = slides.length;
    slides.push(liveDraft);
  }
  const hiddenNote =
    liveDraft && !isBannerShown(liveDraft)
      ? liveDraft.visibleFrom && new Date(liveDraft.visibleFrom) > new Date()
        ? fill(t.customerApp.previewHiddenScheduled, {
            date: formatShortDateTime(toZonedInput(liveDraft.visibleFrom, timezone), locale),
          })
        : t.customerApp.previewHiddenEnded
      : null;

  const steps = instructions.map((i) =>
    i.id === editingInstruction?.id && instructionDraft !== null ? instructionDraft : i.text
  );
  if (instructionEditor?.mode === "create") steps.push(instructionDraft ?? "");
  const activeStep = editingInstruction
    ? editingInstructionIndex
    : instructionEditor?.mode === "create"
      ? steps.length - 1
      : null;

  const isEmpty = isBanners ? banners.length === 0 : instructions.length === 0;
  const newLabel = isBanners ? t.customerApp.newBanner : t.customerApp.newInstruction;
  const openNew = isBanners ? openNewBanner : openNewInstruction;

  return (
    <>
      <DashboardHeader
        navKey="customerApp"
        tabs={
          <Tabs value={tab} onValueChange={(v) => changeTab(v as CustomerAppTab)}>
            <TabsList className="h-9!">
              <TabsTrigger value="banners" className="px-3">
                {t.customerApp.tabBanners}
              </TabsTrigger>
              <TabsTrigger value="instructions" className="px-3">
                <span className="sm:hidden">{t.customerApp.tabInstructionsShort}</span>
                <span className="hidden sm:inline">{t.customerApp.tabInstructions}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {/* Su desktop la pagina non scorre: scorrono solo le singole colonne */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-24 md:pb-4 lg:h-[calc(100svh-5rem)] lg:min-h-0 lg:flex-none lg:overflow-hidden">
        <div className="grid flex-1 items-start gap-6 lg:min-h-0 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-stretch min-[85rem]:grid-cols-[16rem_minmax(0,1fr)_18rem] 2xl:grid-cols-[18rem_minmax(0,1fr)_21rem]">
          {/* Lista, nell'ordine in cui la vedono i clienti */}
          <aside className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <p className="px-2 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {isBanners ? t.customerApp.bannersHeading : t.customerApp.instructionsHeading}
            </p>
            {isEmpty ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center lg:hidden">
                <EmptyText isBanners={isBanners} />
              </div>
            ) : isBanners ? (
              <SortableList
                dndId="banners-dnd"
                items={banners}
                selectedId={editingBanner?.id ?? null}
                canReorder={!isSessionLoading && canManageBanners}
                itemName={bannerName}
                onSelect={openBanner}
                onReorder={handleBannerReorder}
                renderItem={(banner) => {
                  const ended = banner.type === "EVENT" && !!banner.endsAt && new Date(banner.endsAt) < new Date();
                  const draft = bannerToDraft(banner);
                  return (
                    <>
                      <BannerThumb imageUrl={draft.imageUrl} color={draft.color} className={cn(ended && "opacity-50")} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm font-medium", ended && "text-muted-foreground")}>
                          {bannerName(banner)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{bannerSubtitle(banner)}</span>
                      </span>
                    </>
                  );
                }}
              />
            ) : (
              <SortableList
                dndId="order-instructions-dnd"
                items={instructions}
                selectedId={editingInstruction?.id ?? null}
                canReorder={!isSessionLoading && canManageOrderInstructions}
                itemName={(i) => stripMarkdown(i.text)}
                onSelect={openInstruction}
                onReorder={handleInstructionReorder}
                renderItem={(instruction, index) => (
                  <>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary-foreground tabular-nums dark:text-primary">
                      {index + 1}
                    </span>
                    <span className="line-clamp-2 min-w-0 flex-1 text-sm">{stripMarkdown(instruction.text)}</span>
                  </>
                )}
              />
            )}

            {/* Stesso stile del pulsante "Categoria" nel menù */}
            {canEdit && (
              <button
                type="button"
                onClick={openNew}
                className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <PlusIcon className="size-4" />
                {newLabel}
              </button>
            )}
          </aside>

          {/* Editor (schermi larghi) */}
          <section className="hidden min-h-0 overflow-hidden rounded-xl border bg-card lg:block">
            {panelNode && isWide ? (
              panelNode
            ) : (
              <EditorPlaceholder
                icon={isBanners ? ImageIcon : ListOrderedIcon}
                title={
                  isEmpty
                    ? isBanners ? t.customerApp.emptyBannersTitle : t.customerApp.emptyInstructionsTitle
                    : isBanners ? t.customerApp.selectBannerTitle : t.customerApp.selectInstructionTitle
                }
                hint={
                  isEmpty
                    ? isBanners ? t.customerApp.emptyBannersDescription : t.customerApp.emptyInstructionsDescription
                    : isBanners ? t.customerApp.selectBannerHint : t.customerApp.selectInstructionHint
                }
                actionLabel={canEdit ? newLabel : undefined}
                onAction={openNew}
              />
            )}
          </section>

          {/* Anteprima sul telefono del cliente */}
          <aside className="hidden min-h-0 overflow-y-auto pb-4 min-[85rem]:block" aria-label={t.customerApp.previewHeading}>
            <p className="px-2 pb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t.customerApp.previewHeading}
            </p>
            {isBanners ? (
              <BannerPreview slides={slides} index={slideIndex} categories={categories} />
            ) : (
              <InstructionsPreview steps={steps} activeIndex={activeStep} />
            )}
            <p className="px-2 pt-3 text-center text-xs text-muted-foreground">
              {isBanners ? hiddenNote : t.customerApp.previewInstructionsHint}
            </p>
          </aside>
        </div>

        {/* Editor come sheet (mobile/tablet) */}
        <Sheet
          open={!!panelNode && !isWide}
          onOpenChange={(open) => {
            if (open) return;
            if (isBanners) closeBannerEditor();
            else closeInstructionEditor();
          }}
        >
          <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 sm:max-w-lg">
            <SheetTitle className="sr-only">
              {isBanners
                ? editingBanner ? bannerName(editingBanner) : t.customerApp.newBanner
                : editingInstruction
                  ? fill(t.customerApp.stepLabel, { n: editingInstructionIndex + 1 })
                  : t.customerApp.newInstruction}
            </SheetTitle>
            {!isWide && panelNode}
          </SheetContent>
        </Sheet>

        <AlertDialog open={!!pendingNavigation} onOpenChange={(open) => !open && setPendingNavigation(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.customerApp.unsavedTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.customerApp.unsavedDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.customerApp.keepEditing}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  dirtyRef.current = false;
                  pendingNavigation?.();
                  setPendingNavigation(null);
                }}
              >
                {t.customerApp.discard}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <DeleteBannerDialog
          open={!!deletingBanner}
          onOpenChange={(open) => !open && setDeletingBanner(null)}
          banner={deletingBanner}
          onDeleted={handleBannerDeleted}
        />
        <DeleteInstructionDialog
          open={!!deletingInstruction}
          onOpenChange={(open) => !open && setDeletingInstruction(null)}
          instruction={deletingInstruction}
          onDeleted={handleInstructionDeleted}
        />
      </div>
    </>
  );
}

function EmptyText({ isBanners }: { isBanners: boolean }) {
  const { t } = useLocale();
  return (
    <>
      <p className="font-medium">
        {isBanners ? t.customerApp.emptyBannersTitle : t.customerApp.emptyInstructionsTitle}
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {isBanners ? t.customerApp.emptyBannersDescription : t.customerApp.emptyInstructionsDescription}
      </p>
    </>
  );
}

function EditorPlaceholder({
  icon: Icon,
  title,
  hint,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  actionLabel?: string;
  onAction: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon className="size-8 text-muted-foreground/60" />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
      {actionLabel && (
        <Button variant="outline" onClick={onAction}>
          <PlusIcon />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
