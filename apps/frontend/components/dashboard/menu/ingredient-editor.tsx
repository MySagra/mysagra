"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2Icon, XIcon } from "lucide-react";
import { Food, Ingredient } from "@/lib/api-types";
import { createIngredient, updateIngredient } from "@/actions/ingredients";
import { parseDecimal, formatDecimal } from "@/lib/decimal-parser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/contexts/locale-context";
import { fill } from "./menu-utils";

type IngredientFormValues = {
  name: string;
  surcharge: string;
};

export interface IngredientEditorProps {
  /** null = create a new ingredient */
  ingredient: Ingredient | null;
  ingredients: Ingredient[];
  /** Dishes that use this ingredient */
  usedBy: Food[];
  canEdit: boolean;
  canDelete: boolean;
  onSaved: (ingredient: Ingredient, isNew: boolean) => void;
  onDeleteRequest: (ingredient: Ingredient) => void;
  /** force = skip the unsaved-changes guard */
  onClose: (force?: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onOpenFood: (food: Food) => void;
}

export function IngredientEditor({
  ingredient,
  ingredients,
  usedBy,
  canEdit,
  canDelete,
  onSaved,
  onDeleteRequest,
  onClose,
  onDirtyChange,
  onOpenFood,
}: IngredientEditorProps) {
  const { t } = useLocale();
  const isEditing = !!ingredient;

  const schema = z.object({
    name: z.string().trim().min(1, t.ingredients.nameRequired).max(100),
    surcharge: z.string().refine((v) => {
      const parsed = parseDecimal(v);
      return parsed >= 0 && parsed <= 99.99;
    }, t.ingredients.sovraprezzoInvalid),
  });

  const form = useForm<IngredientFormValues>({
    resolver: standardSchemaResolver(schema) as unknown as Resolver<IngredientFormValues>,
    defaultValues: {
      name: ingredient?.name ?? "",
      surcharge: formatDecimal(ingredient?.surcharge ?? 0.5).replace(".", ","),
    },
  });
  const { register, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  async function onSubmit(values: IngredientFormValues) {
    const name = values.name.trim();
    const duplicate = ingredients.some(
      (i) => i.id !== ingredient?.id && i.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      form.setError("name", { message: t.menu.ingredientNameDuplicate });
      return;
    }

    const data = { name, surcharge: parseDecimal(values.surcharge) };
    const result = ingredient
      ? await updateIngredient(ingredient.id, data)
      : await createIngredient(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(ingredient ? t.ingredients.toastUpdated : t.ingredients.toastCreated);
    onSaved(result.data, !ingredient);
    form.reset(values);
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex h-full min-h-0 flex-col"
      noValidate
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold">
          {ingredient ? ingredient.name : t.menu.newExtra}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onClose()}
          aria-label={t.menu.close}
        >
          <XIcon />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <fieldset disabled={!canEdit || isSubmitting} className="space-y-5">
          {!canEdit && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              {t.menu.readOnlyNotice}
            </p>
          )}

          <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ingredient-name">{t.menu.nameLabel}</Label>
              <Input
                id="ingredient-name"
                autoComplete="off"
                maxLength={100}
                placeholder={t.ingredients.namePlaceholder}
                autoFocus={!ingredient}
                aria-invalid={!!errors.name}
                {...register("name")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ingredient-surcharge">{t.menu.columnSurcharge}</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
                <Input
                  id="ingredient-surcharge"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,50"
                  className="pl-6 tabular-nums"
                  aria-invalid={!!errors.surcharge}
                  {...register("surcharge")}
                />
              </div>
            </div>
            {(errors.name || errors.surcharge) && (
              <p className="col-span-2 -mt-1 text-xs text-destructive">
                {errors.name?.message ?? errors.surcharge?.message}
              </p>
            )}
            <p className="col-span-2 -mt-1 text-xs text-muted-foreground">
              {isEditing && usedBy.length > 1
                ? t.menu.surchargeSharedWarning
                : t.menu.surchargeHint}
            </p>
          </div>
        </fieldset>

        {isEditing && (
          <div className="space-y-2">
            <Label>{t.menu.usedInLabel}</Label>
            {usedBy.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.menu.notUsedHint}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {usedBy.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => onOpenFood(food)}
                    title={fill(t.menu.openDish, { name: food.name })}
                    className="inline-flex h-8 items-center rounded-lg border bg-muted/40 px-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-muted"
                  >
                    {food.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 border-t px-4 py-3">
          {ingredient && canDelete && (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-destructive hover:text-destructive"
              onClick={() => onDeleteRequest(ingredient)}
            >
              <Trash2Icon />
              {t.common.delete}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className={ingredient && canDelete ? "" : "ml-auto"}
            onClick={() => onClose(true)}
          >
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting || (isEditing && !isDirty)}>
            {isSubmitting ? t.ingredients.saving : isEditing ? t.common.save : t.ingredients.create}
          </Button>
        </div>
      )}
    </form>
  );
}
