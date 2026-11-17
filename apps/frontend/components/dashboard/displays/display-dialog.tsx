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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";
import { viewLabel } from "./displays-table";

const VIEWS: DisplayView[] = ["READY", "PREPARING", "HYBRID"];

const EMPTY_VALUES: DisplayRequest = {
  name: "",
  description: "",
  view: "READY",
  showAlert: true,
  autoScroll: true,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl select-none">
            {isEditing ? t.displays.editTitle : t.displays.newTitle}
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
                        <Textarea
                          id="description"
                          placeholder={t.displays.descriptionPlaceholder}
                          maxLength={250}
                          rows={2}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="view"
                render={({ field }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>{t.displays.viewLabel}</FieldLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VIEWS.map((view) => (
                              <SelectItem key={view} value={view}>
                                {viewLabel(t, view)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FieldDescription>
                        {{
                          READY: t.displays.viewReadyHint,
                          PREPARING: t.displays.viewPreparingHint,
                          HYBRID: t.displays.viewHybridHint,
                        }[field.value]}
                      </FieldDescription>
                    </Field>
                  </FormItem>
                )}
              />

              {(["showAlert", "autoScroll"] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Checkbox
                          id={name}
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FieldLabel htmlFor={name} className="mb-0 font-normal">
                        {name === "showAlert" ? t.displays.showAlertLabel : t.displays.autoScrollLabel}
                      </FieldLabel>
                    </FormItem>
                  )}
                />
              ))}

              <FormField
                control={form.control}
                name="stationIds"
                render={({ field }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>{t.displays.stationsLabel}</FieldLabel>
                      <FieldDescription>{t.displays.stationsHint}</FieldDescription>
                      {stations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t.displays.noStationsAvailable}</p>
                      ) : (
                        <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
                          {stations.map((station) => (
                            <label
                              key={station.id}
                              className="flex items-center gap-2 text-sm cursor-pointer"
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
            </FieldGroup>
            <DialogFooter>
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete(display!);
                    onOpenChange(false);
                  }}
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
