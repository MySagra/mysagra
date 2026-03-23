"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { CashRegister, Printer } from "@/lib/api-types";
import {
  createCashRegister,
  updateCashRegister,
} from "@/actions/cash-registers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";
import { useRole } from "@/hooks/use-role";

type CashRegisterFormValues = {
  name: string;
  defaultPrinterId: string;
  enabled: boolean;
};

interface CashRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegister: CashRegister | null;
  printers: Printer[];
  onSaved: (cashRegister: CashRegister) => void;
  onDelete?: (cashRegister: CashRegister) => void;
}

export function CashRegisterDialog({
  open,
  onOpenChange,
  cashRegister,
  printers,
  onSaved,
  onDelete,
}: CashRegisterDialogProps) {
  const { t } = useLocale();
  const { canDelete } = useRole();
  const isEditing = !!cashRegister;

  const cashRegisterSchema = z.object({
    name: z.string().min(1, t.cashRegisters.nameRequired),
    defaultPrinterId: z.string().min(1, t.cashRegisters.printerRequired),
    enabled: z.boolean(),
  });

  const form = useForm<CashRegisterFormValues>({
    resolver: standardSchemaResolver(cashRegisterSchema),
    defaultValues: {
      name: "",
      defaultPrinterId: printers[0]?.id || "",
      enabled: true,
    },
  });

  useEffect(() => {
    if (cashRegister) {
      form.reset({
        name: cashRegister.name,
        defaultPrinterId: cashRegister.defaultPrinterId,
        enabled: cashRegister.enabled,
      });
    } else {
      form.reset({
        name: "",
        defaultPrinterId: printers[0]?.id || "",
        enabled: true,
      });
    }
  }, [cashRegister, open, printers, form]);

  async function onSubmit(values: CashRegisterFormValues) {
    try {
      const data = {
        name: values.name.trim(),
        defaultPrinterId: values.defaultPrinterId,
        enabled: values.enabled,
      };

      if (isEditing && cashRegister) {
        const updated = await updateCashRegister(cashRegister.id, data);
        onSaved(updated);
        toast.success(t.cashRegisters.toastUpdated);
      } else {
        const created = await createCashRegister(data);
        onSaved(created);
        toast.success(t.cashRegisters.toastCreated);
      }
    } catch (error: any) {
      toast.error(error.message || t.cashRegisters.toastErrorSave);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing
                ? t.cashRegisters.editTitle
                : t.cashRegisters.newTitle}
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup className="py-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel required>{t.cashRegisters.nameLabel}</FieldLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t.cashRegisters.namePlaceholder}
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-3">
                  <FieldLabel htmlFor="enabled" className="mb-0">
                    {t.cashRegisters.enabledLabel}
                  </FieldLabel>
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Checkbox
                            id="enabled"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="defaultPrinterId"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel required>{t.cashRegisters.cashPrinterLabel}</FieldLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t.cashRegisters.printerSelectPlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {printers.map((printer) => (
                                <SelectItem key={printer.id} value={printer.id}>
                                  {printer.name}{printer.ip ? ` (${printer.ip})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
              </FieldGroup>
              <DialogFooter>
                {canDelete && isEditing && onDelete && cashRegister && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => { onDelete!(cashRegister!); onOpenChange(false); }}
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
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? t.cashRegisters.saving
                    : isEditing
                      ? t.common.save
                      : t.cashRegisters.create}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
  );
}
