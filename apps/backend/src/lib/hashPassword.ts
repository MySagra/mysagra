import bcrypt from "bcrypt";

import { env } from '@/config/env'

// NOTE: bcrypt only hashes the first 72 bytes of `password + PEPPER`. The password length is
// capped in the schema (max 72) so valid passwords stay inside that window. Keeping this scheme
// preserves existing stored hashes; the stronger HMAC-prehash scheme is deferred to the version
// that ships password recovery (which lets users reset the hashes that change breaks).
export async function createHashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password + env.PEPPER, saltRounds);
    return hash;
}

export async function checkHashPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password + env.PEPPER, hash);
}
