"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Field,
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
import { EyeIcon, EyeOffIcon } from "lucide-react";
import z from "zod";

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
                await new Promise((resolve) => setTimeout(resolve, 100));
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
            <Card className="overflow-hidden p-0 shadow-lg">
                <CardContent className="grid p-0 md:grid-cols-2">
                    {/* Form side */}
                    <form
                        className="flex flex-col justify-center gap-6 p-8 md:p-10"
                        onSubmit={form.handleSubmit(onSubmit, onError)}
                    >
                        <img
                            src="/logo.svg"
                            alt="Logo"
                            className="mx-auto h-20 sm:h-24 md:h-28 w-auto select-none"
                        />

                        <div className="flex flex-col items-center gap-1.5 text-center">
                            <h1 className="text-2xl font-bold select-none">
                                {t.login.title}
                            </h1>
                            <p className="text-muted-foreground text-sm text-balance select-none">
                                {t.login.subtitle}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
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
                                                <div className="relative">
                                                    <Input
                                                        autoComplete="off"
                                                        placeholder={t.login.passwordPlaceholder}
                                                        type={showPassword ? "text" : "password"}
                                                        className="h-10 pr-10"
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setShowPassword((v) => !v)}
                                                    >
                                                        {showPassword ? (
                                                            <EyeOffIcon className="h-4 w-4" />
                                                        ) : (
                                                            <EyeIcon className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </Field>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 text-base select-none"
                        >
                            {isLoading ? t.login.submitting : t.login.submit}
                        </Button>
                    </form>

                    {/* Image side — hidden on mobile, fills height of form on desktop */}
                    <div className="relative hidden md:block">
                        <img
                            src="/placeholder.jpg"
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover select-none"
                        />
                    </div>
                </CardContent>
            </Card>
        </FormProvider>
    );
}
