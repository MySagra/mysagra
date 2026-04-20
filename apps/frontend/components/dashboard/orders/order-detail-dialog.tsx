"use client";

import { useState, useEffect, useMemo } from 'react';
import { CashRegister, CategorizedItems, OrderDetailResponse } from '@/lib/api-types';
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
import { FileText, Printer, Trash2, User, LayoutGrid, Hash, Ticket, CalendarPlus, CalendarCheck, CreditCard, MonitorCheck, Clock, CircleCheck, PackageCheck, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getOrderById, deleteOrder, reprintOrder } from '@/actions/orders';
import { useLocale } from '@/contexts/locale-context';
import { useTimezone } from '@/contexts/timezone-context';
import { useRole } from '@/hooks/use-role';

// ─── Status config ───────────────────────────────────────────────────────────

const statusConfig: Record<string, { icon: React.ReactNode; colorClass: string; bgClass: string }> = {
  PENDING:   { icon: <Clock className="h-4 w-4" />,       colorClass: 'text-yellow-600 dark:text-yellow-400', bgClass: 'bg-yellow-500/10 border-yellow-500/30' },
  CONFIRMED: { icon: <CircleCheck className="h-4 w-4" />, colorClass: 'text-primary',                        bgClass: 'bg-primary/10 border-primary/30' },
  COMPLETED: { icon: <PackageCheck className="h-4 w-4" />,colorClass: 'text-green-600 dark:text-green-400',  bgClass: 'bg-green-500/10 border-green-500/30' },
  PICKED_UP: { icon: <ShoppingBag className="h-4 w-4" />, colorClass: 'text-green-700 dark:text-green-500',  bgClass: 'bg-green-600/10 border-green-600/30' },
};

// ─── Reprint Dialog ──────────────────────────────────────────────────────────

interface ReprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  categorizedItems: CategorizedItems[];
  onSuccess: () => void;
}

function ReprintDialog({ open, onOpenChange, orderId, categorizedItems, onSuccess }: ReprintDialogProps) {
  const { t } = useLocale();

  // category id → selected item ids
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [reprintReceipt, setReprintReceipt] = useState(false);
  const [loading, setLoading] = useState(false);

  // reset on open
  useEffect(() => {
    if (open) {
      setSelectedCategories(new Set());
      setReprintReceipt(false);
    }
  }, [open]);

  function toggleCategory(catId: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
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
    if (!result.ok) {
      toast.error(result.error || t.orders.toastErrorReprint);
      return;
    }
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
          <DialogDescription>
            {t.orders.reprintDialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Categories */}
          {categorizedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t.orders.reprintCategories}</p>
              <div className="space-y-2">
                {categorizedItems.map(catItem => (
                  <label
                    key={catItem.category.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedCategories.has(catItem.category.id)}
                      onCheckedChange={() => toggleCategory(catItem.category.id)}
                      disabled={loading}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{catItem.category.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({catItem.items.length} {catItem.items.length === 1 ? "prodotto" : "prodotti"})
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Receipt */}
          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
            <Checkbox
              checked={reprintReceipt}
              onCheckedChange={(v) => setReprintReceipt(!!v)}
              disabled={loading}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.orders.reprintReceiptLabel}</p>
              <p className="text-xs text-muted-foreground">{t.orders.reprintReceiptDescription}</p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit || loading}>
            <Printer className="h-4 w-4 mr-2" />
            {loading ? (t.orders.reprinting) : (t.orders.reprintButton)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted dark:bg-muted/40 rounded-lg">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-muted dark:bg-muted/40 rounded-lg">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
      <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/20 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-8 w-32 ml-auto" />
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
  cashRegisters?: CashRegister[];
}

export function OrderDetailDialog({ orderId, open, onOpenChange, onOrderUpdated, cashRegisters = [] }: OrderDetailDialogProps) {
  const { t } = useLocale();
  const timezone = useTimezone();
  const { canDelete } = useRole();
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Build a lookup map from cashRegisterId → name
  const cashRegisterMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cr of cashRegisters) {
      map.set(cr.id, cr.name);
    }
    return map;
  }, [cashRegisters]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReprintDialog, setShowReprintDialog] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      setLoading(true);
      getOrderById(orderId)
        .then(setOrder)
        .catch(() => {
          toast.error(t.orders.toastErrorLoad);
          onOpenChange(false);
        })
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
    if (!result.ok) {
      toast.error(result.error || t.orders.toastErrorDelete);
      return;
    }
    toast.success(t.orders.toastDeleted);
    onOpenChange(false);
    onOrderUpdated?.();
  }

  const isConfirmed = order?.status === 'CONFIRMED' || order?.status === 'COMPLETED' || order?.status === 'PICKED_UP';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-150 max-h-[90vh] flex flex-col select-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.orders.detailTitle} {order?.displayCode || ''}
            </DialogTitle>
            <DialogDescription>{t.orders.detailDescription}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="overflow-y-auto flex-1">
            {loading ? (
              <OrderDetailSkeleton />
            ) : order ? (
              <div className="space-y-4 pr-1">

                {/* ── Hero: status + total ─────────────────────────────── */}
                {(() => {
                  const cfg = statusConfig[order.status];
                  const statusLabel = order.status === 'PENDING' ? t.orders.statusPending
                    : order.status === 'CONFIRMED' ? t.orders.statusConfirmed
                    : order.status === 'COMPLETED' ? t.orders.statusReady
                    : order.status === 'PICKED_UP' ? t.orders.statusPickedUp
                    : order.status;
                  return (
                    <div className={cn('flex items-center justify-between rounded-lg border px-4 py-3', cfg?.bgClass ?? 'bg-muted border-border')}>
                      <div className={cn('flex items-center gap-2 font-semibold text-sm', cfg?.colorClass ?? 'text-foreground')}>
                        {cfg?.icon}
                        {statusLabel}
                      </div>
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {parseFloat(order.total || order.subTotal).toFixed(2)} €
                      </span>
                    </div>
                  );
                })()}

                {/* ── Info grid ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border">
                  {[
                    { icon: <User className="h-3.5 w-3.5" />,         label: t.orders.detailCustomer,        value: order.customer,                mono: false },
                    { icon: <LayoutGrid className="h-3.5 w-3.5" />,   label: t.orders.detailTable,            value: order.table === 'NO_TABLE_PRESET' ? '--' : order.table, mono: false },
                    { icon: <Hash className="h-3.5 w-3.5" />,         label: t.orders.detailCode,             value: order.displayCode,             mono: true  },
                    { icon: <Ticket className="h-3.5 w-3.5" />,       label: t.orders.detailTicket,           value: order.ticketNumber ?? 'N/A',   mono: true  },
                    { icon: <CreditCard className="h-3.5 w-3.5" />,   label: t.orders.detailPayment,          value: order.paymentMethod || 'N/A',  mono: true  },
                    { icon: <MonitorCheck className="h-3.5 w-3.5" />, label: t.orders.detailCashRegister,    value: (() => { const id = (order as any).cashRegisterId || (order as any).cashRegister; if (!id) return 'N/A'; return cashRegisterMap.get(id) ?? (order as any).cashRegister?.name ?? id; })(), mono: false },
                    {
                      icon: <CalendarPlus className="h-3.5 w-3.5" />,
                      label: t.orders.detailCreationDate,
                      value: new Date(order.createdAt).toLocaleString('it-IT', { timeZone: timezone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                      mono: false,
                    },
                    {
                      icon: <CalendarCheck className="h-3.5 w-3.5" />,
                      label: t.orders.detailConfirmationDate,
                      value: order.confirmedAt
                        ? new Date(order.confirmedAt).toLocaleString('it-IT', { timeZone: timezone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'N/A',
                      mono: false,
                    },
                  ].map(({ icon, label, value, mono }) => (
                    <div key={label} className="flex flex-col gap-1 bg-background p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {icon}
                        <span className="text-xs">{label}</span>
                      </div>
                      <p className={cn('text-sm font-semibold leading-snug truncate', mono && 'font-mono text-amber-600 dark:text-amber-400')} title={String(value)}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── Items ────────────────────────────────────────────── */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t.orders.detailProducts}
                  </h4>
                  {order.categorizedItems?.map((catItem, catIndex) => (
                    <div key={catIndex} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide whitespace-nowrap">
                          {catItem.category.name}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="space-y-1">
                        {catItem.items.map((item, itemIndex) => {
                          const unitSurcharge = parseFloat(item.unitSurcharge?.toString() || '0');
                          return (
                            <div key={itemIndex} className="flex items-start justify-between gap-3 px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm leading-tight">{item.food.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                                  {item.quantity} × {parseFloat(item.unitPrice.toString()).toFixed(2)} €
                                  {unitSurcharge > 0 && (
                                    <span className="ml-1 text-amber-600 dark:text-amber-400">(+{unitSurcharge.toFixed(2)} €)</span>
                                  )}
                                </p>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    "{item.notes}"
                                  </p>
                                )}
                              </div>
                              <p className="font-bold text-sm tabular-nums shrink-0">
                                {parseFloat(item.total.toString()).toFixed(2)} €
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Totals ───────────────────────────────────────────── */}
                <div className="rounded-lg border bg-muted/30 overflow-hidden">
                  <div className="divide-y">
                    <div className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="text-muted-foreground">{t.orders.detailSubtotal}</span>
                      <span className="font-medium tabular-nums">{parseFloat(order.subTotal).toFixed(2)} €</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="text-muted-foreground">{t.orders.detailTotalSurcharges}</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                        +{parseFloat(order.surcharge?.toString() || '0').toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="text-muted-foreground">{t.orders.detailDiscount}</span>
                      <span className="font-medium text-green-600 dark:text-green-400 tabular-nums">
                        -{parseFloat(order.discount?.toString() || '0').toFixed(2)} €
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border-t border-amber-500/20">
                    <span className="font-bold text-base">{t.orders.detailTotal}</span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {parseFloat(order.total || order.subTotal).toFixed(2)} €
                    </span>
                  </div>
                </div>

              </div>
            ) : null}
          </ScrollArea>

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

      {/* Delete confirmation */}
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

      {/* Reprint dialog */}
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
