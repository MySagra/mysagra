"use client"

import React from "react";
import { useForm } from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"

import { Input } from "@/components/ui/input"

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Logo from "@/components/logo";
import { useTranslations } from "next-intl";

export default function Login() {
    const router = useRouter();
    const t = useTranslations('Admin.Login')

    const formSchema = z.object({
        username: z.string({ required_error: t('validation.required') }),
        password: z.string({ required_error: t('validation.required') })
    });

    const form = useForm<z.input<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: ""
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        fetch('/api/auth/login', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: values.username, password: values.password })
        }).then(async res => {
            const data = await res.json();
            if (!res.ok) {
                form.reset();
                toast.error(t('error'))
                return;
            }
            localStorage.setItem("user", JSON.stringify(data));
            if (data.role === "admin") {
                router.push("/admin/dashboard");
            }
            else {
                router.push("/operator/dashboard");
            }
        }).catch(async res => {
            console.log(await res.json());
        })
    }
    return (
        <div className="h-screen w-full flex place-content-center items-center bg-secondary-foreground">
            <h1 className="text-primary absolute top-0 p-3 md:left-0 font-bold text-lg">{process.env.NEXT_PUBLIC_APP_NAME}</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="h-screen w-full flex flex-col items-center place-content-center">
                        <Card className="w-[350px]">
                            <CardHeader>
                                <div className="relative flex w-full place-content-center pb-6">
                                    <Logo className="h-28" />
                                </div>
                                <CardTitle className="text-center">{t('title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">

                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder={t('username')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder={t('password')} type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => form.reset()}
                                >
                                    {t('clearButton')}
                                </Button>
                                <Button type="submit">{t('loginButton')}</Button>
                            </CardFooter>
                        </Card>
                    </div >
                </form>
            </Form >
            <div className=" absolute bottom-0 text-sm text-white">
                <Link href={"https://www.mysagra.com/"} target="_blank" rel="noopener noreferrer" >
                    {"Powered by"}
                    <Button variant={"link"} className="p-1.5">
                        {"MySagra"}
                    </Button>
                </Link>
            </div>
        </div>
    );
}
