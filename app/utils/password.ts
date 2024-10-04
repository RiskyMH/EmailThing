import { createId } from "@paralleldrive/cuid2"

const algorithm = "SHA-512"


async function pwdHash(password: string, salt: string, alg = 'SHA-512') {
    const iterations = alg === 'sha512' ? 1000 : 50000;
    const keylen = 64;
    const digest = alg === 'sha512' ? 'SHA-512' : algorithm;

    const encodedPassword = new TextEncoder().encode(password);
    const encodedSalt = new TextEncoder().encode(salt);

    try {
        const derivedKey = await crypto.subtle.importKey(
            'raw',
            encodedPassword,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: encodedSalt,
                iterations,
                hash: digest,
            },
            derivedKey,
            keylen * 8
        );

        const hashedPassword = Array.from(new Uint8Array(derivedBits))
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');

        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password: ' + (error as Error).message);
    }
}

export const createPasswordHash = async (password: string) => {
    const salt = createId()
    const hash = await pwdHash(password, salt)

    return `${algorithm}:${salt}:${hash}`
}

export const verifyPassword = async (
    proposedPassword: string,
    passwordHash: string,
) => {
    const [alg, salt, hash] = passwordHash.split(":")
    if (!alg || !salt || !hash) return false
    if (alg !== algorithm) {
        if (alg === "sha512") {
            console.warn("Password hash is using deprecated algorithm sha512")
        } else {
            return false
        }
    }

    const proposedHash = await pwdHash(proposedPassword, salt, alg)

    const isValid = proposedHash === hash

    // if its valid and using the old algorithm, return the new hash
    if (isValid && alg === "sha512") {
        return createPasswordHash(proposedPassword)
    }

    return isValid
}