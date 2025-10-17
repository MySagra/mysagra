import { getAccessToken } from "@/lib/auth/getTokens";
import { Role } from "@/types/user";
import { apiClient } from "@/lib/apiClient";

export async function getRoles(): Promise<Array<Role>> {
    return (await apiClient.get(`v1/roles`, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data
}