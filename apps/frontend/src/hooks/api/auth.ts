'use client'

import { login } from "@/services/auth.service"
import { useMutation } from "@tanstack/react-query"
import { logout } from "@/services/auth.service"

export function useLogin() {
    return useMutation({
        mutationFn: ({ username, password }: { username: string; password: string }) => login(username, password)
    })
}

export function useLogout() {
    return useMutation({
        mutationFn: logout
    })
}