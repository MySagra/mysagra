'use server'

import { getAccessToken } from "@/lib/auth/getTokens";
import { User } from "@/types/user";
import { apiClient } from "@/lib/apiClient";
import { UserFormValues, getUserFormSchema } from "@/schemas/userForm";
import { getTranslations } from "next-intl/server";

// Get all users
export async function getUsers(): Promise<Array<User>> {
    return (await apiClient.get("v1/users", {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

// Create a new user with validation
export async function createUser(userData: UserFormValues): Promise<User> {
    const t = await getTranslations('User');
    
    // Validate user data with Zod schema
    const validatedData = getUserFormSchema(t).parse(userData);
    
    return (await apiClient.post("v1/users", validatedData, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

// Delete a user
export async function deleteUser(userId: number): Promise<User> {
    return (await apiClient.delete(`v1/users/${userId}`, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}