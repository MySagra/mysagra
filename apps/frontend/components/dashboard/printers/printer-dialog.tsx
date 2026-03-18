"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Printer } from "@/lib/api-types";
import { createPrinter, updatePrinter } from "@/actions/printers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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


interface PrinterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printer: Printer | null;
  onSaved: (printer: Printer) => void;
  onDelete?: (printer: Printer) => void;
}

export function PrinterDialog({
  open,
  onOpenChange,
  printer,
  onSaved,
  onDelete,
}: PrinterDialogProps) {
  const { t } = useLocale();
  const { canDelete } = useRole();
  const isEditing = !!printer;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const printerSchema = z.object({
    name: z.string().min(1, t.printers.nameRequired),
    ip: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, t.printers.ipInvalid),
    port: z.coerce
      .number()
      .int()
      .min(0, t.printers.portMin)
      .max(65535, t.printers.portMax),
    description: z.string().optional(),
  });
  type PrinterFormValues = z.output<typeof printerSchema>;

  const form = useForm<PrinterFormValues>({
    resolver: standardSchemaResolver(printerSchema) as unknown as Resolver<PrinterFormValues>,
    defaultValues: {
      name: "",
      ip: "",
      port: 9100,
      description: "",
    },
  });

  useEffect(() => {
    if (printer) {
      form.reset({
        name: printer.name,
        ip: printer.ip,
        port: printer.port,
        description: printer.description || "",
      });
    } else {
      form.reset({
        name: "",
        ip: "",
        port: 9100,
        description: "",
      });
    }
  }, [printer, open, form]);

  async function onSubmit(values: PrinterFormValues) {
    try {
      const data = {
        name: values.name.trim(),
        ip: values.ip.trim(),
        port: values.port as number,
        description: (values.description as string | undefined)?.trim() ?? "",
      };

      if (isEditing && printer) {
        const updated = await updatePrinter(printer.id, {
          ...data,
          status: printer.status,
        });
        onSaved(updated);
        toast.success(t.printers.toastUpdated);
      } else {
        const created = await createPrinter(data);
        onSaved(created);
        toast.success(t.printers.toastCreated);
      }
    } catch (error: any) {
      toast.error(error.message || t.printers.toastErrorSave);
    }
  }

  function handleDeleteConfirm() {
    if (printer && onDelete) {
      setShowDeleteConfirm(false);
      onDelete(printer);
      onOpenChange(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t.printers.editTitle : t.printers.newTitle}
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup className="py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>{t.printers.nameLabel}</FieldLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t.printers.namePlaceholder}
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ip"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>{t.printers.ipLabel}</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="192.168.1.100" />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>{t.printers.portLabel}</FieldLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={String(field.value ?? "")}
                            type="number"
                            placeholder="9100"
                            min={0}
                            max={65535}
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>{t.printers.descriptionLabel}</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.printers.descriptionPlaceholder} />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
              </FieldGroup>
              <DialogFooter>
                {canDelete && isEditing && onDelete && printer && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
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
                    ? t.printers.saving
                    : isEditing
                      ? t.common.save
                      : t.printers.create}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.printers.confirmDeletionTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.printers.confirmDeletionDescription} <span className="font-bold">{printer?.name}</span>?
              <br />
              {t.printers.cannotUndo}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              variant="destructive"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
