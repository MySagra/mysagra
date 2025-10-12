export type User = {
    id: number,
    username: string
    role: Role
}

export type Role = {
    id: number,
    name: string
}

export type UserLogin = {
    user: {
        username: string,
        role: string
    },
    accessToken: string
}