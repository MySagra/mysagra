"use client";

import { useState, useEffect } from 'react';
import { OrderDetailResponse } from '@/lib/api-types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Printer, Trash2, User, LayoutGrid, Hash, Ticket,
  CalendarPlus, CalendarCheck, CreditCard, MonitorCheck, Clock,
  CircleCheck, PackageCheck, ShoppingBag, XIcon, GitMerge, Activity,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getOrderById, deleteOrder, reprintOrder } from '@/actions/orders';
import { useLocale } from '@/contexts/locale-context';
import { useTimezone } from '@/contexts/timezone-context';
import { useRole } from '@/hooks/use-role';

// ─── Status config ───────────────────────────────────────────────────────────

const statusConfig: Record<string, { icon: React.ReactNode; colorClass: string; bgClass: string }> = {
  PENDING:   { icon: <Clock className="h-4 w-4" />,        colorClass: 'text-yellow-600 dark:text-yellow-400', bgClass: 'bg-yellow-500/10 border-yellow-500/30' },
  CONFIRMED: { icon: <CircleCheck className="h-4 w-4" />,  colorClass: 'text-primary',                         bgClass: 'bg-primary/10 border-primary/30' },
  COMPLETED: { icon: <PackageCheck className="h-4 w-4" />, colorClass: 'text-green-600 dark:text-green-400',   bgClass: 'bg-green-500/10 border-green-500/30' },
  PICKED_UP: { icon: <ShoppingBag className="h-4 w-4" />,  colorClass: 'text-green-700 dark:text-green-500',   bgClass: 'bg-green-600/10 border-green-600/30' },
  CANCELLED: { icon: <XIcon className="h-4 w-4" />,        colorClass: 'text-destructive',                     bgClass: 'bg-destructive/10 border-destructive/30' },
  PARTIAL:   { icon: <GitMerge className="h-4 w-4" />,     colorClass: 'text-orange-600 dark:text-orange-400', bgClass: 'bg-orange-500/10 border-orange-500/30' },
};

// ─── Reprint Dialog ──────────────────────────────────────────────────────────

interface ReprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  categorizedItems: OrderDetailResponse['categorizedItems'];
  onSuccess: () => void;
}

function ReprintDialog({ open, onOpenChange, orderId, categorizedItems, onSuccess }: ReprintDialogProps) {
  const { t } = useLocale();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [reprintReceipt, setReprintReceipt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedCategories(new Set());
      setReprintReceipt(false);
    }
  }, [open]);

  function toggleCategory(catId: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  }

  const selectedItemIds = categorizedItems
    .filter(c => selectedCategories.has(c.category.id))
    .flatMap(c => c.items.map(i => i.id));

  const canSubmit = selectedItemIds.length > 0 || reprintReceipt;

  async function handleConfirm() {
    setLoading(true);
    const result = await reprintOrder(orderId, {
      orderItems: selectedItemIds.length > 0 ? selectedItemIds : undefined,
      reprintReceipt,
    });
    setLoading(false);
    if (!result.ok) { toast.error(result.error || t.orders.toastErrorReprint); return; }
    toast.success(t.orders.toastReprinted);
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            {t.orders.reprintDialogTitle}
          </DialogTitle>
          <DialogDescription>{t.orders.reprintDialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {categorizedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t.orders.reprintCategories}</p>
              <div className="space-y-2">
                {categorizedItems.map(catItem => (
                  <label key={catItem.category.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={selectedCategories.has(catItem.category.id)}
                      onCheckedChange={() => toggleCategory(catItem.category.id)}
                      disabled={loading}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{catItem.category.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({catItem.items.length} {catItem.items.length === 1 ? 'prodotto' : 'prodotti'})
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          <Separator />
          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
            <Checkbox checked={reprintReceipt} onCheckedChange={(v) => setReprintReceipt(!!v)} disabled={loading} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.orders.reprintReceiptLabel}</p>
              <p className="text-xs text-muted-foreground">{t.orders.reprintReceiptDescription}</p>
            </div>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>{t.common.cancel}</Button>
          <Button onClick={handleConfirm} disabled={!canSubmit || loading}>
            <Printer className="h-4 w-4 mr-2" />
            {loading ? t.orders.reprinting : t.orders.reprintButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function OrderDetailSkeleton() {
  return (
    <div className="space-y-3 p-1">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5 p-3 bg-background">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3.5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────

interface OrderDetailDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: () => void;
}

export function OrderDetailDialog({ orderId, open, onOpenChange, onOrderUpdated }: OrderDetailDialogProps) {
  const { t } = useLocale();
  const timezone = useTimezone();
  const { canDelete } = useRole();
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReprintDialog, setShowReprintDialog] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      setLoading(true);
      getOrderById(orderId)
        .then(setOrder)
        .catch(() => { toast.error(t.orders.toastErrorLoad); onOpenChange(false); })
        .finally(() => setLoading(false));
    } else if (!open) {
      setOrder(null);
    }
  }, [open, orderId, onOpenChange]);

  async function handleDeleteConfirm() {
    if (!orderId) return;
    setShowDeleteConfirm(false);
    setDeleting(true);
    const result = await deleteOrder(orderId);
    setDeleting(false);
    if (!result.ok) { toast.error(result.error || t.orders.toastErrorDelete); return; }
    toast.success(t.orders.toastDeleted);
    onOpenChange(false);
    onOrderUpdated?.();
  }

  const isConfirmed = order?.status === 'CONFIRMED' || order?.status === 'COMPLETED' || order?.status === 'PICKED_UP';

  function getStatusLabel(status: string) {
    switch (status) {
      case 'PENDING':   return t.orders.statusPending;
      case 'CONFIRMED': return t.orders.statusConfirmed;
      case 'COMPLETED': return t.orders.statusReady;
      case 'PICKED_UP': return t.orders.statusPickedUp;
      case 'CANCELLED': return t.orders.statusCancelled;
      case 'PARTIAL':   return t.orders.statusPartial;
      default: return status;
    }
  }

  function getStationStatusLabel(status: string) {
    switch (status) {
      case 'PENDING':   return t.orders.statusPending;
      case 'CONFIRMED': return t.orders.statusConfirmed;
      case 'COMPLETED': return t.orders.statusCompleted ?? 'Completato';
      case 'PICKED_UP': return t.orders.statusPickedUp;
      case 'CANCELLED': return t.orders.statusCancelled;
      case 'PARTIAL':   return t.orders.statusPartial;
      default: return status;
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('it-IT', {
      timeZone: timezone,
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('it-IT', {
      timeZone: timezone,
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-150 max-h-[90vh] flex flex-col select-none">

          {/* ── Header ───────────────────────────────────────────── */}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 shrink-0" />
              {t.orders.detailTitle}
            </DialogTitle>
            <DialogDescription asChild>
              {order ? (
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span>{order.customer}</span>
                  </span>
                  {order.table && order.table !== 'NO_TABLE_PRESET' && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="flex items-center gap-1">
                        <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                        <span>Tavolo {order.table}</span>
                      </span>
                    </>
                  )}
                </span>
              ) : (
                <span>{t.orders.detailDescription}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="overflow-y-auto flex-1">
            {loading ? (
              <OrderDetailSkeleton />
            ) : order ? (
              <div className="space-y-3 pr-1">

                {/* ── Hero card ────────────────────────────────────── */}
                {(() => {
                  const cfg = statusConfig[order.status];
                  const totalUnits = order.categorizedItems?.flatMap(c => c.items).reduce((sum, i) => sum + i.quantity, 0) ?? 0;
                  const totalProducts = order.categorizedItems?.flatMap(c => c.items).length ?? 0;
                  const paymentLabel = order.paymentMethod === 'CARD' ? 'CARTA' : order.paymentMethod === 'CASH' ? 'CONTANTI' : null;

                  return (
                    <div className={cn('rounded-xl border px-4 py-3.5', cfg?.bgClass ?? 'bg-muted border-border')}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0">
                          <div className={cn('flex items-center gap-1.5 font-semibold text-sm', cfg?.colorClass)}>
                            {cfg?.icon}
                            {getStatusLabel(order.status)}
                            {order.confirmedAt && (
                              <span className="text-xs font-normal opacity-70 ml-0.5">
                                · {fmtTime(order.confirmedAt)}
                              </span>
                            )}
                          </div>
                          {paymentLabel && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <CreditCard className="h-3 w-3 shrink-0" />
                              <span className="tracking-wide">{paymentLabel}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums leading-none tracking-tight">
                            {parseFloat(order.total || order.subTotal).toFixed(2)} €
                          </p>
                          <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                            {totalProducts} {totalProducts === 1 ? 'prodotto' : 'prodotti'} · {totalUnits} {totalUnits === 1 ? 'unità' : 'unità'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Timeline ─────────────────────────────────────── */}
                {(() => {
                  const confirmedCfg = statusConfig['CONFIRMED'];
                  const completedCfg = statusConfig['COMPLETED'];
                  const Connector = () => (
                    <div className="flex items-center gap-0.5 text-muted-foreground/25 shrink-0 px-2">
                      <div className="h-px w-3 bg-current" />
                      <ArrowRight className="h-2.5 w-2.5" />
                    </div>
                  );
                  return (
                    <div className="flex items-center rounded-lg border bg-muted/30 px-4 py-3">
                      {/* Created — neutral */}
                      <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                        <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold leading-none text-center">
                          {t.orders.detailCreationDate}
                        </p>
                        <p className="text-xs font-semibold tabular-nums text-center leading-none">
                          {fmtDate(order.createdAt)}
                        </p>
                      </div>

                      {/* Confirmed — only if confirmedAt exists */}
                      {order.confirmedAt && (
                        <>
                          <Connector />
                          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                            <CalendarCheck className={cn('h-4 w-4', confirmedCfg.colorClass)} />
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold leading-none text-center">
                              {t.orders.detailConfirmationDate}
                            </p>
                            <p className={cn('text-xs font-semibold tabular-nums text-center leading-none', confirmedCfg.colorClass)}>
                              {fmtDate(order.confirmedAt)}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Completed — green, only if present */}
                      {order.completedAt && (
                        <>
                          <Connector />
                          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                            <PackageCheck className={cn('h-4 w-4', completedCfg.colorClass)} />
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold leading-none text-center">
                              {t.orders.detailCompletionDate}
                            </p>
                            <p className={cn('text-xs font-semibold tabular-nums text-center leading-none', completedCfg.colorClass)}>
                              {fmtDate(order.completedAt)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* ── Info grid ────────────────────────────────────── */}
                {(() => {
                  const cells = [
                    { icon: <Hash className="h-3 w-3" />,         label: t.orders.detailCode,                                value: order.displayCode,                  mono: true  },
                    { icon: <Ticket className="h-3 w-3" />,       label: t.orders.detailTicket,                              value: String(order.ticketNumber ?? 'N/A'), mono: true  },
                    { icon: <MonitorCheck className="h-3 w-3" />, label: t.orders.detailCashRegister.replace(':', '').trim(), value: order.cashRegister?.name ?? 'N/A',  mono: false },
                    { icon: <User className="h-3 w-3" />,         label: t.orders.detailConfirmedBy,                         value: order.user?.username ?? 'N/A',       mono: false },
                  ];

                  return (
                    <div className="grid grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border">
                      {cells.map(({ icon, label, value, mono }) => (
                        <div key={label} className="flex flex-col gap-1 bg-background p-3">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {icon}
                            <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
                          </div>
                          <p
                            className={cn('text-sm font-semibold leading-snug truncate', mono && 'font-mono text-amber-600 dark:text-amber-400')}
                            title={String(value)}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* ── Products ─────────────────────────────────────── */}
                <div className="space-y-3 pt-1">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {t.orders.detailProducts}
                    {order.categorizedItems && (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {order.categorizedItems.flatMap(c => c.items).length}
                      </span>
                    )}
                  </h4>

                  {order.categorizedItems?.map((catItem, catIndex) => (
                    <div key={catIndex} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-0.5 h-3.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                          {catItem.category.name}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {catItem.items.map((item, itemIndex) => {
                          const unitSurcharge = parseFloat(item.unitSurcharge?.toString() || '0');
                          return (
                            <div
                              key={itemIndex}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                            >
                              <span className="text-xs font-bold tabular-nums text-muted-foreground bg-muted border border-border/60 px-1.5 py-0.5 rounded shrink-0 min-w-7.5 text-center leading-tight">
                                {item.quantity}×
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm leading-tight">{item.food.name}</p>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground mt-0.5 italic">"{item.notes}"</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-sm tabular-nums">
                                  {parseFloat(item.total.toString()).toFixed(2)} €
                                </p>
                                {unitSurcharge > 0 && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400 tabular-nums">
                                    +{unitSurcharge.toFixed(2)} €
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Totals ───────────────────────────────────────── */}
                <div className="rounded-xl border overflow-hidden">
                  <div className="divide-y">
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">{t.orders.detailSubtotal}</span>
                      <span className="font-medium tabular-nums">{parseFloat(order.subTotal).toFixed(2)} €</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">{t.orders.detailTotalSurcharges}</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                        +{parseFloat(order.surcharge?.toString() || '0').toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">{t.orders.detailDiscount}</span>
                      <span className="font-medium text-green-600 dark:text-green-400 tabular-nums">
                        -{parseFloat(order.discount?.toString() || '0').toFixed(2)} €
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5 bg-amber-500/10 border-t border-amber-500/20">
                    <span className="font-bold text-sm">{t.orders.detailTotal}</span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {parseFloat(order.total || order.subTotal).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* ── Station States ───────────────────────────────── */}
                {order.orderStationStates && order.orderStationStates.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <Activity className="h-3.5 w-3.5" />
                      {t.orders.detailStationStates}
                      <span className="text-foreground/60">{order.orderStationStates.length}</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.orderStationStates.map((ss) => {
                        const cfg = statusConfig[ss.status];
                        const stationLabel = ss.station?.name ?? `${t.orders.detailStation} ${ss.stationId.slice(-6).toUpperCase()}`;
                        return (
                          <div
                            key={ss.stationId}
                            className={cn(
                              'flex items-center justify-between rounded-lg border px-3.5 py-2.5',
                              cfg?.bgClass ?? 'bg-muted border-border'
                            )}
                          >
                            <span className="text-sm font-semibold truncate">{stationLabel}</span>
                            <span className={cn('flex items-center gap-1.5 text-xs font-semibold shrink-0 ml-2', cfg?.colorClass)}>
                              {cfg?.icon}
                              {getStationStatusLabel(ss.status)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            ) : null}
          </ScrollArea>

          {/* ── Footer ───────────────────────────────────────────── */}
          <DialogFooter>
            <div className="flex items-center justify-between gap-2 w-full">
              {canDelete && (
                <Button
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting || loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? t.orders.deleting : t.common.delete}
                </Button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {isConfirmed && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setShowReprintDialog(true)}
                    disabled={deleting || loading}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    {t.orders.reprintButton}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => onOpenChange(false)}
                  disabled={deleting}
                >
                  {t.orders.closeButton}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ──────────────────────────────────── */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.orders.confirmDeletionTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.orders.confirmDeletionDescription} <span className="font-bold">{order?.displayCode}</span>?
              <br />
              {t.orders.cannotUndo}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting} variant="destructive">
              {deleting ? t.orders.deleting : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reprint dialog ───────────────────────────────────────── */}
      {order && orderId && (
        <ReprintDialog
          open={showReprintDialog}
          onOpenChange={setShowReprintDialog}
          orderId={orderId}
          categorizedItems={order.categorizedItems ?? []}
          onSuccess={() => {}}
        />
      )}
    </>
  );
}
