"use client";

import { useState, useEffect } from 'react';
import { OrderDetailResponse } from '@/lib/api-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Printer, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getOrderById, deleteOrder } from '@/actions/orders';
import { useLocale } from '@/contexts/locale-context';
import { useRole } from '@/hooks/use-role';

interface OrderDetailDialogProps {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: () => void;
}

export function OrderDetailDialog({ orderId, open, onOpenChange, onOrderUpdated }: OrderDetailDialogProps) {
  const { t } = useLocale();
  const { canDelete } = useRole();
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    try {
      await deleteOrder(orderId);
      toast.success(t.orders.toastDeleted);
      onOpenChange(false);
      onOrderUpdated?.();
    } catch (error) {
      toast.error(t.orders.toastErrorDelete);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col select-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.orders.detailTitle} {order?.displayCode || ''}
            </DialogTitle>
            <DialogDescription>
              {t.orders.detailDescription}
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{t.common.loading}</div>
            </div>
          ) : order ? (
            <ScrollArea className="overflow-y-auto pr-4">
              <div className="space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted dark:bg-muted/40 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.orders.detailCustomer}</p>
                    <h1 className={cn("font-semibold text-sm mb-1 truncate select-none", order.customer.length < 15 ? "text-xl" : "")} title={order.customer}>
                      {order.customer}
                    </h1>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.orders.detailTable}</p>
                    <p className="font-medium">{order.table}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.orders.detailCode}</p>
                    <p className="font-mono font-bold text-amber-600">{order.displayCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.orders.detailTicket}</p>
                    <p className="font-mono font-bold text-amber-600">{order.ticketNumber ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.orders.detailCreationDate}</p>
                    <p className="text-sm">
                      {new Date(order.createdAt).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.orders.detailConfirmationDate}</p>
                    <p className="text-sm">
                      {order.confirmedAt ? new Date(order.confirmedAt).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.orders.detailPayment}</p>
                    <p className="font-mono font-bold text-amber-600">
                      {order.paymentMethod === 'CARD' ? 'CARD' : order.paymentMethod === 'CASH' ? 'CASH' : order.paymentMethod || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.orders.detailStatus}</p>
                    <div className="font-mono font-bold text-amber-600">
                      {order.status === 'PENDING' ? t.orders.statusPending
                        : order.status === 'CONFIRMED' ? t.orders.statusConfirmed
                          : order.status === 'COMPLETED' ? t.orders.statusReady
                            : order.status === 'PICKED_UP' ? t.orders.statusPickedUp
                              : order.status || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  <h4 className="font-semibold">{t.orders.detailProducts}</h4>
                  <div className="space-y-3 max-h-[340px] overflow-y-auto ">
                    {order.categorizedItems.map((catItem, catIndex) => (
                      <div key={catIndex}>
                        <h5 className="text-sm font-semibold text-amber-600 mb-2">
                          {catItem.category.name}
                        </h5>
                        <div className="space-y-2">
                          {catItem.items.map((item, itemIndex) => {
                            const unitSurcharge = parseFloat(item.unitSurcharge?.toString() || '0');
                            return (
                              <div key={itemIndex} className="flex items-start justify-between p-2 bg-muted dark:bg-muted/40 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium">{item.food.name}</p>
                                  {item.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {t.orders.detailNotes} {item.notes}
                                    </p>
                                  )}
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {t.orders.detailQuantity} {item.quantity} × {parseFloat(item.unitPrice.toString()).toFixed(2)} €
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    {parseFloat(item.total.toString()).toFixed(2)} €
                                  </p>
                                  {unitSurcharge > 0 && (
                                    <p className="text-xs text-amber-600 dark:text-amber-500">
                                      (+{unitSurcharge.toFixed(2)} €)
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
                </div>

                {/* Total */}
                <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/20">
                  <div>
                    <div className="items-center space-y-0 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{t.orders.detailSubtotal}</div>
                        <div className="font-bold text-muted-foreground">
                          {parseFloat(order.subTotal).toFixed(2)} €
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{t.orders.detailTotalSurcharges}</div>
                        <div className="font-bold text-amber-600 dark:text-amber-500">
                          {parseFloat(order.surcharge?.toString() || '0').toFixed(2)} €
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{t.orders.detailDiscount}</div>
                        <div className="font-bold text-green-600 dark:text-green-500">
                          {parseFloat(order.discount?.toString() || '0').toFixed(2)} €
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-semibold">{t.orders.detailTotal}</div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                        {parseFloat(order.total || order.subTotal).toFixed(2)} €
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cash Register - if available */}
                {(order as any).cashRegister && (
                  <div className="p-3 bg-muted dark:bg-muted/40 rounded-lg">
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t.orders.detailCashRegister} </span>
                      <span className="font-mono font-bold text-amber-600">
                        {(order as any).cashRegister.name || (order as any).cashRegister}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}


          <DialogFooter>
            <div className="flex items-center justify-between gap-2 w-full">
              {canDelete && (
                <Button
                  variant="destructive"
                  className='cursor-pointer'
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting || loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? t.orders.deleting : t.common.delete}
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className='cursor-pointer'
                  onClick={() => toast.error(t.orders.toastPrintNotImplemented)}
                  disabled={deleting}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {t.orders.printButton}
                </Button>
                <Button
                  variant="outline"
                  className='cursor-pointer'
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
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? t.orders.deleting : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
