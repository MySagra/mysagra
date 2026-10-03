"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronRightIcon, PlusIcon, PrinterIcon, Trash2Icon, XIcon } from "lucide-react";
import { Food, FoodRequest, Category, Ingredient, Printer } from "@/lib/api-types";
import { createFood, updateFood } from "@/actions/foods";
import { parseDecimal, formatDecimal } from "@/lib/decimal-parser";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLocale } from "@/contexts/locale-context";
import { AvailabilitySegmented } from "./availability-control";
import { fill, formatPrice } from "./menu-utils";

const CATEGORY_PRINTER = "__category";
const NO_PRINTER = "__none";

type FoodFormValues = {
  name: string;
  price: string;
  categoryId: string;
  description: string;
  available: boolean;
  ingredientIds: string[];
  printerId: string | null;
};

export interface FoodEditorProps {
  /** null = create a new dish */
  food: Food | null;
  defaultCategoryId: string | null;
  categories: Category[];
  ingredients: Ingredient[];
  printers: Printer[];
  /** All dishes, used for the duplicate-name check */
  foods: Food[];
  canEdit: boolean;
  canDelete: boolean;
  onSaved: (food: Food, isNew: boolean) => void;
  onDeleteRequest: (food: Food) => void;
  /** force = skip the unsaved-changes guard */
  onClose: (force?: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCreateIngredient: (name: string, onCreated: (ingredient: Ingredient) => void) => void;
  /** Breadcrumb: torna alle impostazioni della categoria */
  onOpenCategory: (category: Category) => void;
}

export function FoodEditor({
  food,
  defaultCategoryId,
  categories,
  ingredients,
  printers,
  foods,
  canEdit,
  canDelete,
  onSaved,
  onDeleteRequest,
  onClose,
  onDirtyChange,
  onCreateIngredient,
  onOpenCategory,
}: FoodEditorProps) {
  const { t } = useLocale();
  const isEditing = !!food;

  const schema = z.object({
    name: z.string().trim().min(1, t.foods.nameRequired).max(100),
    price: z.string().refine((v) => parseDecimal(v) >= 0.01, t.menu.priceInvalid),
    categoryId: z.string().min(1, t.foods.categoryRequired),
    description: z.string().max(250),
    available: z.boolean(),
    ingredientIds: z.array(z.string()),
    printerId: z.string().nullable(),
  });

  const defaultValues = useMemo<FoodFormValues>(() => {
    if (food) {
      return {
        name: food.name,
        price: formatDecimal(food.price).replace(".", ","),
        categoryId: food.categoryId,
        description: food.description ?? "",
        available: food.available,
        ingredientIds: food.ingredients?.map((i) => i.id) ?? [],
        printerId: food.printerId ?? null,
      };
    }
    const category = categories.find((c) => c.id === defaultCategoryId) ?? categories[0];
    return {
      name: "",
      price: "",
      categoryId: category?.id ?? "",
      description: "",
      available: category?.available ?? true,
      ingredientIds: [],
      printerId: category?.printerId ?? null,
    };
    // Il parent rimonta l'editor (key) quando cambia piatto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<FoodFormValues>({
    resolver: standardSchemaResolver(schema) as unknown as Resolver<FoodFormValues>,
    defaultValues,
  });
  const { register, watch, setValue, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  // Disponibilità e stampante possono cambiare da fuori (chip in lista,
  // impostazioni categoria): aggiorna i campi se l'utente non li ha toccati.
  const externalAvailable = food?.available;
  const externalPrinterId = food?.printerId ?? null;
  useEffect(() => {
    if (externalAvailable === undefined) return;
    if (!form.getFieldState("available").isDirty) {
      form.resetField("available", { defaultValue: externalAvailable });
    }
  }, [externalAvailable, form]);
  useEffect(() => {
    if (!food) return;
    if (!form.getFieldState("printerId").isDirty) {
      form.resetField("printerId", { defaultValue: externalPrinterId });
    }
  }, [externalPrinterId, food, form]);

  const categoryId = watch("categoryId");
  const available = watch("available");
  const ingredientIds = watch("ingredientIds");
  const printerId = watch("printerId");
  const description = watch("description");

  const category = categories.find((c) => c.id === categoryId);
  // Il percorso segue la categoria salvata, non quella scelta nel form
  const parentCategory = food ? categories.find((c) => c.id === food.categoryId) : category;
  const categoryPrinterId = category?.printerId ?? null;
  const followsCategoryPrinter = printerId === categoryPrinterId;
  const [showPrinterSelect, setShowPrinterSelect] = useState(!followsCategoryPrinter);

  const selectedIngredients = ingredientIds
    .map((id) => ingredients.find((i) => i.id === id))
    .filter((i): i is Ingredient => !!i);

  function printerName(id: string | null) {
    return printers.find((p) => p.id === id)?.name ?? "—";
  }

  function handleCategoryChange(nextId: string) {
    const next = categories.find((c) => c.id === nextId);
    setValue("categoryId", nextId, { shouldDirty: true, shouldValidate: true });
    if (!next) return;
    // Chi seguiva la stampante della categoria continua a seguirla
    if (followsCategoryPrinter) {
      setValue("printerId", next.printerId ?? null, { shouldDirty: true });
    }
    if (!isEditing) {
      setValue("available", next.available, { shouldDirty: true });
    }
  }

  function handlePrinterChange(value: string) {
    const next =
      value === CATEGORY_PRINTER ? categoryPrinterId : value === NO_PRINTER ? null : value;
    setValue("printerId", next, { shouldDirty: true });
  }

  function addIngredient(id: string) {
    if (ingredientIds.includes(id)) return;
    setValue("ingredientIds", [...ingredientIds, id], { shouldDirty: true });
  }

  function removeIngredient(id: string) {
    setValue(
      "ingredientIds",
      ingredientIds.filter((i) => i !== id),
      { shouldDirty: true }
    );
  }

  async function onSubmit(values: FoodFormValues) {
    const name = values.name.trim();
    const duplicate = foods.some(
      (f) => f.id !== food?.id && f.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      form.setError("name", { message: t.foods.nameDuplicate });
      return;
    }

    const data: FoodRequest = {
      name,
      description: values.description.trim(),
      price: parseDecimal(values.price),
      categoryId: values.categoryId,
      available: values.available,
      printerId: values.printerId,
      ingredients: values.ingredientIds.map((id) => ({ id })),
    };

    const result = food ? await updateFood(food.id, data) : await createFood(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(food ? t.foods.toastUpdated : t.foods.toastCreated);
    // La risposta non sempre include le relazioni: usa quelle scelte nel form
    onSaved(
      {
        ...result.data,
        ingredients: result.data.ingredients ?? selectedIngredients,
      },
      !food
    );
    form.reset(values);
  }

  const printerSummary = followsCategoryPrinter
    ? categoryPrinterId
      ? fill(t.menu.printerInherited, {
          printer: printerName(categoryPrinterId),
          category: category?.name ?? "",
        })
      : fill(t.menu.printerInheritedNone, { category: category?.name ?? "" })
    : printerId
      ? fill(t.menu.printerOverride, { printer: printerName(printerId) })
      : t.menu.printerOverrideNone;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex h-full min-h-0 flex-col"
      noValidate
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {parentCategory && (
            <>
              <button
                type="button"
                onClick={() => onOpenCategory(parentCategory)}
                title={fill(t.menu.openCategory, { name: parentCategory.name })}
                className="max-w-[45%] shrink-0 truncate rounded text-base text-muted-foreground transition-colors outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {parentCategory.name}
              </button>
              <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground/70" />
            </>
          )}
          <h2 className="min-w-0 truncate text-base font-semibold">
            {food ? food.name : t.menu.editorNewTitle}
          </h2>
        </div>
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

      <fieldset
        disabled={!canEdit || isSubmitting}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4"
      >
        {!canEdit && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {t.menu.readOnlyNotice}
          </p>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="food-name">{t.menu.nameLabel}</Label>
            <Input
              id="food-name"
              autoComplete="off"
              maxLength={100}
              placeholder={t.menu.namePlaceholder}
              autoFocus={!food}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="food-price">{t.menu.priceLabel}</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                €
              </span>
              <Input
                id="food-price"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                className="pl-6 tabular-nums"
                aria-invalid={!!errors.price}
                {...register("price")}
              />
            </div>
          </div>
          {(errors.name || errors.price) && (
            <p className="col-span-2 -mt-1 text-xs text-destructive">
              {errors.name?.message ?? errors.price?.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t.menu.categoryLabel}</Label>
          <Select value={categoryId} onValueChange={handleCategoryChange} disabled={!canEdit}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.categoryId}>
              <SelectValue placeholder={t.foods.categorySelectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t.menu.statusLabel}</Label>
          <AvailabilitySegmented
            value={available}
            disabled={!canEdit}
            onChange={(v) => setValue("available", v, { shouldDirty: true })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-1.5">
            <Label>{t.menu.extrasLabel}</Label>
            <span className="text-xs text-muted-foreground">· {t.menu.extrasHint}</span>
          </div>
          {selectedIngredients.length === 0 && (
            <p className="text-xs text-muted-foreground">{t.menu.noExtrasSelected}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {selectedIngredients.map((ingredient) => (
              <span
                key={ingredient.id}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-muted/40 pr-1 pl-2.5 text-sm"
              >
                {ingredient.name}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Number(ingredient.surcharge) > 0
                    ? `+${formatPrice(ingredient.surcharge)}`
                    : t.menu.free}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(ingredient.id)}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={fill(t.menu.removeExtra, { name: ingredient.name })}
                  >
                    <XIcon className="size-3.5" />
                  </button>
                )}
              </span>
            ))}
            {canEdit && (
              <ExtrasPicker
                ingredients={ingredients}
                selectedIds={ingredientIds}
                onAdd={addIngredient}
                onCreate={(name) => onCreateIngredient(name, (created) => addIngredient(created.id))}
              />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="food-description">{t.menu.descriptionLabel}</Label>
          <Textarea
            id="food-description"
            rows={2}
            maxLength={250}
            className="resize-none"
            placeholder={t.menu.descriptionPlaceholder}
            {...register("description")}
          />
          {description.length > 200 && (
            <p className="text-right text-xs text-muted-foreground">{description.length}/250</p>
          )}
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start gap-2.5">
            <PrinterIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="flex-1 text-sm">{printerSummary}</p>
            {canEdit && !showPrinterSelect && (
              <Button
                type="button"
                variant="link"
                size="xs"
                className="h-auto p-0"
                onClick={() => setShowPrinterSelect(true)}
              >
                {t.menu.changePrinter}
              </Button>
            )}
          </div>
          {showPrinterSelect && (
            <Select
              value={followsCategoryPrinter ? CATEGORY_PRINTER : (printerId ?? NO_PRINTER)}
              onValueChange={handlePrinterChange}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CATEGORY_PRINTER}>
                  {t.menu.sameAsCategory}
                  {categoryPrinterId ? ` (${printerName(categoryPrinterId)})` : ""}
                </SelectItem>
                {printers
                  .filter((p) => p.id !== categoryPrinterId)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                {categoryPrinterId && (
                  <SelectItem value={NO_PRINTER}>{t.menu.noPrinterOption}</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </fieldset>

      {canEdit && (
        <div className="flex items-center gap-2 border-t px-4 py-3">
          {food && canDelete && (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-destructive hover:text-destructive"
              onClick={() => onDeleteRequest(food)}
            >
              <Trash2Icon />
              {t.common.delete}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className={food && canDelete ? "" : "ml-auto"}
            onClick={() => onClose(true)}
          >
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting || (isEditing && !isDirty)}>
            {isSubmitting ? t.foods.saving : isEditing ? t.common.save : t.foods.create}
          </Button>
        </div>
      )}
    </form>
  );
}

function ExtrasPicker({
  ingredients,
  selectedIds,
  onAdd,
  onCreate,
}: {
  ingredients: Ingredient[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const options = ingredients.filter((i) => !selectedIds.includes(i.id));
  const trimmed = search.trim();
  const exists = ingredients.some((i) => i.name.toLowerCase() === trimmed.toLowerCase());

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-8 border-dashed">
          <PlusIcon />
          {t.menu.addExtra}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={t.menu.searchOrCreateExtra}
          />
          <CommandList>
            <CommandEmpty>{t.menu.noExtrasFound}</CommandEmpty>
            {options.length > 0 && (
              <CommandGroup className="p-1.5 [&_[cmdk-group-items]]:space-y-0.5">
                {options.map((ingredient) => (
                  <CommandItem
                    key={ingredient.id}
                    value={`${ingredient.name} ${ingredient.id}`}
                    className="px-2.5 py-2.5"
                    onSelect={() => {
                      onAdd(ingredient.id);
                      setSearch("");
                    }}
                  >
                    <span className="flex-1 truncate">{ingredient.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {Number(ingredient.surcharge) > 0
                        ? `+${formatPrice(ingredient.surcharge)}`
                        : t.menu.free}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {trimmed && !exists && (
              <CommandGroup forceMount>
                <CommandItem
                  forceMount
                  value={`__create__ ${trimmed}`}
                  className="px-2.5 py-2.5"
                  onSelect={() => {
                    setOpen(false);
                    setSearch("");
                    onCreate(trimmed);
                  }}
                >
                  <PlusIcon />
                  {fill(t.menu.createExtra, { name: trimmed })}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
