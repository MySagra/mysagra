"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Display, DisplayRequest, DisplayView, Station } from "@/lib/api-types";
import { createDisplay, updateDisplay } from "@/actions/displays";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Trash2Icon, XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { DISPLAY_ZOOM_MAX, DISPLAY_ZOOM_MIN } from "@mysagra/schemas";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";
import { viewLabel } from "./displays-table";

const VIEWS: DisplayView[] = ["READY", "PREPARING", "HYBRID"];
const ZOOM_PRESETS = [DISPLAY_ZOOM_MIN, 100, DISPLAY_ZOOM_MAX];
const ZOOM_STEP = 10;

const EMPTY_VALUES: DisplayRequest = {
  name: "",
  description: "",
  view: "READY",
  showAlert: true,
  autoScroll: true,
  zoom: 100,
  alert: null,
  stationIds: [],
};

interface DisplayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  display: Display | null;
  displays: Display[];
  stations: Station[];
  onSaved: (display: Display) => void;
  onDelete?: (display: Display) => void;
}

export function DisplayDialog({
  open,
  onOpenChange,
  display,
  displays,
  stations,
  onSaved,
  onDelete,
}: DisplayDialogProps) {
  const { t } = useLocale();
  const isEditing = !!display;

  const displaySchema = z.object({
    name: z.string().trim().min(1, t.displays.nameRequired).max(100),
    description: z.string().max(250).nullable(),
    view: z.enum(["READY", "PREPARING", "HYBRID"]),
    showAlert: z.boolean(),
    autoScroll: z.boolean(),
    zoom: z.number().int().min(DISPLAY_ZOOM_MIN).max(DISPLAY_ZOOM_MAX),
    alert: z.string().max(191).nullable(),
    stationIds: z.array(z.string()),
  });

  const form = useForm<DisplayRequest>({
    resolver: standardSchemaResolver(displaySchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(display
        ? {
            name: display.name,
            description: display.description ?? "",
            view: display.view,
            showAlert: display.showAlert,
            autoScroll: display.autoScroll,
            zoom: display.zoom,
            alert: display.alert,
            stationIds: display.stationIds,
          }
        : EMPTY_VALUES);
    }
  }, [display, open, form]);

  async function onSubmit(values: DisplayRequest) {
    const name = values.name.trim();

    const exists = displays.some(
      (d) => d.name.toLowerCase() === name.toLowerCase() && d.id !== display?.id
    );
    if (exists) {
      toast.error(t.displays.nameDuplicate);
      return;
    }

    const data: DisplayRequest = {
      ...values,
      name,
      description: values.description?.trim() || null,
      alert: values.alert?.trim() || null,
    };

    const result = isEditing && display
      ? await updateDisplay(display.id, data)
      : await createDisplay(data);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? t.displays.toastUpdated : t.displays.toastCreated);
    onSaved(result.data);
    onOpenChange(false);
  }

  const viewHints: Record<DisplayView, string> = {
    READY: t.displays.viewReadyHint,
    PREPARING: t.displays.viewPreparingHint,
    HYBRID: t.displays.viewHybridHint,
  };

  const toggles = [
    { name: "showAlert", label: t.displays.showAlertLabel, hint: t.displays.showAlertHint },
    { name: "autoScroll", label: t.displays.autoScrollLabel, hint: t.displays.autoScrollHint },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-xl select-none">
            {isEditing ? t.displays.editTitle : t.displays.newTitle}
          </DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel htmlFor="name" required>
                          {t.displays.nameLabel}
                        </FieldLabel>
                        <FormControl>
                          <Input
                            id="name"
                            autoComplete="off"
                            placeholder={t.displays.namePlaceholder}
                            autoFocus
                            maxLength={100}
                            {...field}
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
                        <FieldLabel htmlFor="description">
                          {t.displays.descriptionLabel}
                        </FieldLabel>
                        <FormControl>
                          <Input
                            id="description"
                            autoComplete="off"
                            placeholder={t.displays.descriptionPlaceholder}
                            maxLength={250}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="view"
                render={({ field }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>{t.displays.viewLabel}</FieldLabel>
                      <div role="radiogroup" className="grid gap-3 sm:grid-cols-3">
                        {VIEWS.map((view) => {
                          const selected = field.value === view;
                          return (
                            <button
                              key={view}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => field.onChange(view)}
                              className={cn(
                                "rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                selected
                                  ? "border-primary bg-primary/10"
                                  : "hover:bg-muted/50"
                              )}
                            >
                              <span className="block font-medium">{viewLabel(t, view)}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {viewHints[view]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="zoom"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>{t.displays.zoomLabel}</FieldLabel>
                        <FieldDescription>{t.displays.zoomHint}</FieldDescription>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t.displays.zoomOut}
                            disabled={field.value <= DISPLAY_ZOOM_MIN}
                            onClick={() => field.onChange(Math.max(DISPLAY_ZOOM_MIN, field.value - ZOOM_STEP))}
                          >
                            <ZoomOutIcon className="h-4 w-4" />
                          </Button>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              min={DISPLAY_ZOOM_MIN}
                              max={DISPLAY_ZOOM_MAX}
                              step={ZOOM_STEP}
                              onValueChange={([value]) => field.onChange(value)}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t.displays.zoomIn}
                            disabled={field.value >= DISPLAY_ZOOM_MAX}
                            onClick={() => field.onChange(Math.min(DISPLAY_ZOOM_MAX, field.value + ZOOM_STEP))}
                          >
                            <ZoomInIcon className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-right text-sm font-medium tabular-nums">
                            {field.value}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {ZOOM_PRESETS.map((preset) => (
                            <Button
                              key={preset}
                              type="button"
                              size="sm"
                              variant={field.value === preset ? "default" : "outline"}
                              onClick={() => field.onChange(preset)}
                            >
                              {preset}%
                            </Button>
                          ))}
                        </div>
                      </Field>
                    </FormItem>
                  )}
                />

                <Field>
                  <FieldLabel>{t.displays.optionsLabel}</FieldLabel>
                  <div className="space-y-2">
                    {toggles.map(({ name, label, hint }) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name}
                        render={({ field }) => (
                          <FormItem>
                            <label
                              htmlFor={name}
                              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3"
                            >
                              <span>
                                <span className="block text-sm font-medium">{label}</span>
                                <span className="block text-xs text-muted-foreground">{hint}</span>
                              </span>
                              <FormControl>
                                <Switch
                                  id={name}
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </label>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </Field>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="alert"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel htmlFor="alert">{t.displays.alertLabel}</FieldLabel>
                        <FieldDescription>{t.displays.alertHint}</FieldDescription>
                        {/* clear button overlaid in the corner, so showing it doesn't shift the layout */}
                        <div className="relative">
                          <FormControl>
                            <Textarea
                              id="alert"
                              placeholder={t.displays.alertPlaceholder}
                              maxLength={191}
                              rows={4}
                              className="resize-none pr-10"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          {field.value && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="absolute top-1.5 right-1.5 text-muted-foreground"
                              aria-label={t.displays.alertClear}
                              title={t.displays.alertClear}
                              onClick={() => field.onChange(null)}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stationIds"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>{t.displays.stationsLabel}</FieldLabel>
                        <FieldDescription>{t.displays.stationsHint}</FieldDescription>
                        {stations.length === 0 ? (
                          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                            {t.displays.noStationsAvailable}
                          </p>
                        ) : (
                          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
                            {stations.map((station) => (
                              <label
                                key={station.id}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                              >
                                <Checkbox
                                  checked={field.value.includes(station.id)}
                                  onCheckedChange={(checked) =>
                                    field.onChange(
                                      checked === true
                                        ? [...field.value, station.id]
                                        : field.value.filter((id) => id !== station.id)
                                    )
                                  }
                                />
                                <span className="truncate">{station.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </Field>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 rounded-b-xl px-6">
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete(display!);
                    onOpenChange(false);
                  }}
                  className="sm:mr-auto"
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
                  ? t.displays.saving
                  : isEditing
                    ? t.common.save
                    : t.displays.create}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
