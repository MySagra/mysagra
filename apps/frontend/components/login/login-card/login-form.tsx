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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { login as loginAction } from "@/actions/auth";
import z from "zod";

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const formSchema = z.object({
        username: z.string().min(1, "Username required"),
        password: z.string().min(1, "Password required"),
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
        try {
            const result = await loginAction(values.username, values.password);
            if (result.success) {
                // Wait a bit for session to be fully set
                await new Promise((resolve) => setTimeout(resolve, 100));
                window.location.href = "/dashboard"; // Force full page reload to ensure session is loaded
            } else {
                toast.error(result.error || "Invalid credentials");
                form.reset();
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Login error");
            form.reset();
        } finally {
            setIsLoading(false);
        }
    }

    // Handle validation errors from react-hook-form (zod)
    function onError(errors: any) {
        // If both username and password are missing, show a combined message
        const usernameError = (errors.username as any)?.message;
        const passwordError = (errors.password as any)?.message;

        if (usernameError && passwordError) {
            toast.error(`Username and Password are required`);
            return;
        }

        const first = Object.values(errors)[0];
        const message = (first as any)?.message || "Validation error";
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
                                        Welcome!
                                    </h1>
                                    <p className="text-muted-foreground text-balance select-none">
                                        Login to your MyAdmin account
                                    </p>
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="username">Username</FieldLabel>
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        autoComplete="off"
                                                        placeholder="Username or Email"
                                                        className="h-10"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        autoComplete="off"
                                                        placeholder="Your password"
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
                                        {isLoading ? "Logging in..." : "Login"}
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
