"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Ingredient } from "@/lib/api-types";
import { createIngredient, updateIngredient } from "@/actions/ingredients";
import { parseDecimal, formatDecimal } from "@/lib/decimal-parser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";
import { useRole } from "@/hooks/use-role";

type IngredientFormValues = {
  name: string;
  surcharge: string;
};

interface IngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: Ingredient | null;
  onSaved: (ingredient: Ingredient) => void;
  onDelete?: (ingredient: Ingredient) => void;
}

export function IngredientDialog({
  open,
  onOpenChange,
  ingredient,
  onSaved,
  onDelete,
}: IngredientDialogProps) {
  const { t } = useLocale();
  const { canDelete } = useRole();
  const isEditing = !!ingredient;

  const ingredientSchema = z.object({
    name: z.string().min(1, t.ingredients.nameRequired),
    surcharge: z.string().refine(
      (val) => {
        const parsed = parseDecimal(val);
        return parsed >= 0 && parsed <= 99.99;
      },
      { message: t.ingredients.sovraprezzoInvalid }
    ),
  });

  const form = useForm<IngredientFormValues>({
    resolver: standardSchemaResolver(ingredientSchema),
    defaultValues: {
      name: "",
      surcharge: "0.50",
    },
  });

  useEffect(() => {
    if (ingredient) {
      form.reset({
        name: ingredient.name,
        surcharge: formatDecimal(ingredient.surcharge),
      });
    } else {
      form.reset({
        name: "",
        surcharge: "0.50",
      });
    }
  }, [ingredient, open, form]);

  async function onSubmit(values: IngredientFormValues) {
    const surcharge = parseDecimal(values.surcharge);
    if (isEditing && ingredient) {
      const result = await updateIngredient(ingredient.id, { name: values.name.trim(), surcharge });
      if (!result.ok) { toast.error(result.error); return; }
      onSaved(result.data);
      toast.success(t.ingredients.toastUpdated);
    } else {
      const result = await createIngredient({ name: values.name.trim(), surcharge });
      if (!result.ok) { toast.error(result.error); return; }
      onSaved(result.data);
      toast.success(t.ingredients.toastCreated);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? t.ingredients.editTitle : t.ingredients.newTitle}
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
                        <FieldLabel required>{t.ingredients.nameLabel}</FieldLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t.ingredients.namePlaceholder}
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
                  name="surcharge"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel required>{t.ingredients.sovraprezzoLabel}</FieldLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t.ingredients.sovraprezzoPlaceholder}
                            type="text"
                            inputMode="decimal"
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
              </FieldGroup>
              <DialogFooter>
                {canDelete && isEditing && onDelete && ingredient && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => { onDelete!(ingredient!); onOpenChange(false); }}
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
                    ? t.ingredients.saving
                    : isEditing
                      ? t.common.save
                      : t.ingredients.create}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
  );
}
