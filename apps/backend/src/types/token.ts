import { Role } from "@mysagra/database";

export type Token = {
    userId: number,
    role: Role,
    iat: number,
    exp: number
}