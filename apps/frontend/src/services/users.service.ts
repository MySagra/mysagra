import { getAccessToken } from "@/lib/auth/getTokens";
import { User } from "@/types/user";
import { apiClient } from "@/lib/apiClient";

export async function getUsers(): Promise<Array<User>> {
    return (await apiClient.get("v1/users", {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data
}