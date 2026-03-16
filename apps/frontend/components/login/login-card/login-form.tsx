"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { login as loginAction } from "@/actions/auth";
import { useLocale } from "@/contexts/locale-context";
import z from "zod";

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useLocale();

    const formSchema = z.object({
        username: z.string().min(1, t.login.username + " required"),
        password: z.string().min(1, t.login.password + " required"),
    });

    const form = useForm<z.input<typeof formSchema>>({
        resolver: standardSchemaResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        const isDefaultAdmin = values.username === "admin" && values.password === "admin";
        try {
            const result = await loginAction(values.username, values.password);
            if (result.success) {
                // Wait a bit for session to be fully set
                await new Promise((resolve) => setTimeout(resolve, 100));
                // Redirect to setup if logging in with default admin credentials
                window.location.href = isDefaultAdmin ? "/setup" : "/dashboard";
            } else {
                const errorMsg =
                    result.error === "role_not_allowed"
                        ? t.login.errorRoleNotAllowed
                        : result.error || t.login.errorInvalid;
                toast.error(errorMsg);
                form.reset();
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error(t.login.errorGeneric);
            form.reset();
        } finally {
            setIsLoading(false);
        }
    }

    function onError(errors: any) {
        const usernameError = (errors.username as any)?.message;
        const passwordError = (errors.password as any)?.message;

        if (usernameError && passwordError) {
            toast.error(t.login.errorBoth);
            return;
        }

        const first = Object.values(errors)[0];
        const message = (first as any)?.message || t.login.validationError;
        toast.error(message);
    }

    return (
        <FormProvider {...form}>
            <div className={cn("flex flex-col gap-6")}>
                <Card className="overflow-hidden p-0">
                    <CardContent className="grid p-0 md:grid-cols-2">
                        <form
                            className="p-6 md:p-8 place-content-center"
                            onSubmit={form.handleSubmit(onSubmit, onError)}
                        >
                            <FieldGroup>
                                <img
                                    src="/logo.svg"
                                    alt="Logo"
                                    className="mx-auto h-36 w-auto select-none"
                                />
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <h1 className="text-2xl font-bold select-none">
                                        {t.login.title}
                                    </h1>
                                    <p className="text-muted-foreground text-balance select-none">
                                        {t.login.subtitle}
                                    </p>
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="username">{t.login.username}</FieldLabel>
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        autoComplete="off"
                                                        placeholder={t.login.usernamePlaceholder}
                                                        className="h-10"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="password">{t.login.password}</FieldLabel>
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        autoComplete="off"
                                                        placeholder={t.login.passwordPlaceholder}
                                                        type="password"
                                                        className="h-10"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </Field>
                                <Field>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full select-none h-10 text-base"
                                    >
                                        {isLoading ? t.login.submitting : t.login.submit}
                                    </Button>
                                </Field>
                            </FieldGroup>
                        </form>
                        <div className="bg-white hidden md:flex items-center justify-center h-150 w-full">
                            <img
                                src="/placeholder.jpg"
                                alt="Logo"
                                className="object-contain select-none"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </FormProvider>
    );
}
