"use client";

import { useEffect, useState } from "react";
import { Station } from "@/lib/api-types";
import { createStation, updateStation, checkStationNameExists } from "@/actions/stations";
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
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm, FormProvider } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { z } from "zod";
import { useLocale } from "@/contexts/locale-context";

type StationFormValues = {
  name: string;
};

interface StationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  onSaved: (station: Station) => void;
  onDelete?: (station: Station) => void;
}

export function StationDialog({
  open,
  onOpenChange,
  station,
  onSaved,
  onDelete,
}: StationDialogProps) {
  const { t } = useLocale();
  const isEditing = !!station;

  const stationSchema = z.object({
    name: z.string().min(1, t.stations.nameRequired).max(100, "Name must be max 100 characters"),
  });

  const form = useForm<StationFormValues>({
    resolver: standardSchemaResolver(stationSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (station) {
        form.reset({
          name: station.name,
        });
      } else {
        form.reset({
          name: "",
        });
      }
    }
  }, [station, open, form]);

  async function onSubmit(values: StationFormValues) {
    const nameTrimmed = values.name.trim();

    const exists = await checkStationNameExists(nameTrimmed, isEditing && station ? station.id : undefined);
    if (exists) {
      toast.error(t.stations.nameDuplicate);
      return;
    }

    const data = {
      name: nameTrimmed,
    };

    let savedStation: Station;

    if (isEditing && station) {
      const result = await updateStation(station.id, data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t.stations.toastUpdated);
      savedStation = result.data;
    } else {
      const result = await createStation(data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t.stations.toastCreated);
      savedStation = result.data;
    }

    onSaved(savedStation);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl select-none">
            {isEditing ? t.stations.editTitle : t.stations.newTitle}
          </DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="py-2">
              <Field>
                <FieldLabel htmlFor="name" required>
                  {t.stations.nameLabel}
                </FieldLabel>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          id="name"
                          autoComplete="off"
                          placeholder={t.stations.namePlaceholder}
                          autoFocus
                          maxLength={100}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete(station!);
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
                  ? t.stations.saving
                  : isEditing
                    ? t.common.save
                    : t.stations.create}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
