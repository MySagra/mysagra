"use client";

import { useEffect, useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const cashRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  defaultPrinterId: z.string().min(1, "Select a default printer"),
  enabled: z.boolean(),
});

type CashRegisterFormValues = z.infer<typeof cashRegisterSchema>;

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
  const isEditing = !!cashRegister;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        toast.success("Cash register updated");
      } else {
        const created = await createCashRegister(data);
        onSaved(created);
        toast.success("Cash register created");
      }
    } catch (error: any) {
      toast.error(error.message || "Error saving");
    }
  }

  function handleDeleteConfirm() {
    if (cashRegister && onDelete) {
      setShowDeleteConfirm(false);
      onDelete(cashRegister);
      onOpenChange(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing
                ? "Edit Cash Register"
                : "New Cash Register"}
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
                        <FieldLabel>Name</FieldLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Register name"
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
                    Enabled
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
                        <FieldLabel>Cash Printer</FieldLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select printer" />
                            </SelectTrigger>
                            <SelectContent>
                              {printers.map((printer) => (
                                <SelectItem key={printer.id} value={printer.id}>
                                  {printer.name} ({printer.ip})
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
                {isEditing && onDelete && cashRegister && (
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
              Are you sure you want to delete the register <span className="font-bold">{cashRegister?.name}</span>?
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
