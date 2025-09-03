import bcrypt from "bcrypt";

import { env } from '@/config/env'

export async function createHashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password + env.PEPPER, saltRounds);
    return hash;
}

export async function checkHashPassword(password: string, hash: string): Promise<boolean> {
    console.log(env.PEPPER)
    return await bcrypt.compare(password + env.PEPPER, hash);
}