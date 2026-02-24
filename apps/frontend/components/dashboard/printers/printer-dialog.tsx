"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
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

const printerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ip: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, "Enter a valid IP address"),
  port: z.coerce
    .number()
    .int()
    .min(0, "Port must be greater than or equal to 0")
    .max(65535, "Port must be less than or equal to 65535"),
  description: z.string().optional(),
});

type PrinterFormValues = z.input<typeof printerSchema>;

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
  const isEditing = !!printer;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<PrinterFormValues>({
    resolver: standardSchemaResolver(printerSchema),
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
        description: values.description?.trim() || undefined,
      };

      if (isEditing && printer) {
        const updated = await updatePrinter(printer.id, {
          ...data,
          status: printer.status,
        });
        onSaved(updated);
        toast.success("Printer updated");
      } else {
        const created = await createPrinter(data);
        onSaved(created);
        toast.success("Printer created");
      }
    } catch (error: any) {
      toast.error(error.message || "Error saving printer");
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
              {isEditing ? "Edit Printer" : "New Printer"}
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
                        <FieldLabel>Name</FieldLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Printer name"
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
                        <FieldLabel>IP Address</FieldLabel>
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
                        <FieldLabel>Port</FieldLabel>
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
                        <FieldLabel>Description</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional description" />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
              </FieldGroup>
              <DialogFooter>
                {isEditing && onDelete && printer && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mr-auto"
                  >
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : isEditing
                      ? "Save"
                      : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the printer <span className="font-bold">{printer?.name}</span>?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
