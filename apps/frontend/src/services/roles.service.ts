import { getJwtFromCookie } from "@/lib/auth/verifyjwt";
import { Role } from "@/types/user";

export async function getRoles(): Promise<Array<Role>> {
    return await fetch(`${process.env.API_URL}/v1/roles`, {
        next: { tags: ['roles']},
        method: "GET",
        headers: {
            "Authorization": `Bearer ${await getJwtFromCookie()}`
        }
    }).then(res => res.json());
}