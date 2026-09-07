class CodeGenerationError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class DisplayCodeGenerator {
    private static readonly ALPHABET = "ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789";
    private static readonly BASE = this.ALPHABET.length;
    private static readonly BASE3 = Math.pow(this.BASE, 3); // the minimum set of chars is 3
    private static readonly BASE4 = Math.pow(this.BASE, 4); // base for 4 character
    private static readonly BASE5 = Math.pow(this.BASE, 5); // base for 5 character
    private static readonly PRIME_NUMBER = 25117;;

    public encode(value: number) {
        if (value <= 0) throw new CodeGenerationError("Invalid integer value, must be greather than 0");

        const { ALPHABET, BASE, PRIME_NUMBER, BASE3, BASE4, BASE5 } = DisplayCodeGenerator;

        const powLength = Math.floor(value / BASE3);

        let M: number;
        if (powLength === 0) M = BASE3;
        else if (powLength === 1) M = BASE4;
        else if (powLength === 2) M = BASE5;
        else throw new CodeGenerationError("The value is too big!");

        let obfuscatedNum = (value * PRIME_NUMBER) % M;

        const len = 3 + powLength;
        const buf = new Array<string>(len).fill("A");
        let i = len - 1;
        while (obfuscatedNum > 0) {
            buf[i--] = ALPHABET[obfuscatedNum % BASE];
            obfuscatedNum = Math.floor(obfuscatedNum / BASE);
        }

        return buf.join("");
    }

}

export const displayCodeGenerator = new DisplayCodeGenerator();