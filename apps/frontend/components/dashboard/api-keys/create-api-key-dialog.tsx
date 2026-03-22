"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { ApiKey, CreateApiKeyResponse } from "@/lib/api-types";
import { createApiKey } from "@/actions/api-keys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  CopyIcon,
  CheckIcon,
  AlertTriangleIcon,
  EyeIcon,
  EyeOffIcon,
  PrinterIcon,
  MonitorIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

type Step = "form" | "reveal";
type ApiKeyType = "PRINTER" | "WEBAPP";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (apiKey: ApiKey) => void;
}

const TYPE_OPTIONS: { value: ApiKeyType; icon: React.ElementType; labelKey: "typePrinter" | "typeWebapp"; descKey: "typePrinterDesc" | "typeWebappDesc" }[] = [
  { value: "PRINTER", icon: PrinterIcon, labelKey: "typePrinter", descKey: "typePrinterDesc" },
  { value: "WEBAPP", icon: MonitorIcon, labelKey: "typeWebapp", descKey: "typeWebappDesc" },
];

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateApiKeyDialogProps) {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>("form");
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);

  const createSchema = z.object({
    name: z.string().min(1, t.apiKeys.nameRequired),
    type: z.enum(["PRINTER", "WEBAPP"]),
  });
  type CreateFormValues = z.output<typeof createSchema>;

  const form = useForm<CreateFormValues>({
    resolver: standardSchemaResolver(createSchema) as unknown as Resolver<CreateFormValues>,
    defaultValues: { name: "", type: "PRINTER" },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ name: "", type: "PRINTER" });
      setCreatedKey(null);
      setCopied(false);
      setKeyVisible(false);
      setStep("form");
    }
  }, [open, form]);

  async function onSubmit(values: CreateFormValues) {
    try {
      const result = await createApiKey({ name: values.name.trim(), type: values.type });
      setCreatedKey(result);
      onCreated({
        id: result.id,
        type: result.type,
        prefix: result.type === "PRINTER" ? "ms_pt_" : "ms_wb_",
        last_digits: result.apiKey.slice(-4),
        name: values.name.trim(),
        createdAt: new Date(result.createdAt),
        lastUsedAt: null,
        revokedAt: null,
      });
      toast.success(t.apiKeys.toastCreated);
      setStep("reveal");
    } catch (error: any) {
      toast.error(error.message || t.apiKeys.toastErrorCreate);
    }
  }

  async function handleCopy() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden h-100">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>
            {step === "form" ? t.apiKeys.newTitle : t.apiKeys.keyCreatedTitle}
          </DialogTitle>
          <DialogDescription>
            {step === "form" ? t.apiKeys.newDescription : t.apiKeys.keyShownOnce}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {step === "form" ? (
            <FormProvider {...form}>
              <form id="create-api-key-form" onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <Field>
                          <FieldLabel>{t.apiKeys.nameLabel}</FieldLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t.apiKeys.namePlaceholder}
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <Field>
                          <FieldLabel>{t.apiKeys.typeLabel}</FieldLabel>
                          <FormControl>
                            <div className="grid grid-cols-2 gap-3">
                              {TYPE_OPTIONS.map(({ value, icon: Icon, labelKey, descKey }) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => field.onChange(value)}
                                  className={cn(
                                    "flex flex-col items-start gap-2 rounded-lg border-2 p-3 text-left transition-all",
                                    field.value === value
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/40"
                                  )}
                                >
                                  <div className={cn(
                                    "rounded-md p-1.5",
                                    field.value === value
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  )}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium leading-none">{t.apiKeys[labelKey]}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t.apiKeys[descKey]}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </Field>
                      </FormItem>
                    )}
                  />
                </FieldGroup>
              </form>
            </FormProvider>
          ) : (
            <div className="space-y-4 py-1">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t.apiKeys.keyShownOnce}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">{t.apiKeys.yourKey}</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      type={keyVisible ? "text" : "password"}
                      value={createdKey?.apiKey ?? ""}
                      className="font-mono text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setKeyVisible((v) => !v)}
                    >
                      {keyVisible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-7 border-t shrink-0">
          {step === "form" ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                form="create-api-key-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.apiKeys.creating}
                  </>
                ) : (
                  t.apiKeys.createButton
                )}
              </Button>
            </>
          ) : (
            <DialogClose asChild>
              <Button
                className={cn(
                  "w-full gap-2 transition-colors",
                  copied && "bg-green-600 hover:bg-green-700 text-white"
                )}
                onClick={copied ? undefined : () => onOpenChange(false)}
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {t.apiKeys.copiedConfirm}
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-4 w-4" />
                    {t.apiKeys.doneButton}
                  </>
                )}
              </Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
