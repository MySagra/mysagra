import { getAccessToken } from "@/lib/auth/getTokens";
import { Role } from "@/types/user";

export async function getRoles(): Promise<Array<Role>> {
    return await fetch(`${process.env.API_URL}/v1/roles`, {
        next: { tags: ['roles']},
        method: "GET",
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    }).then(res => res.json());
}