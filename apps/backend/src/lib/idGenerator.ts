import Squids from 'sqids'

export function generateDisplayId(id: number) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const squids = new Squids({
        alphabet: chars,
        minLength: 3
    })

    return squids.encode([id])
}