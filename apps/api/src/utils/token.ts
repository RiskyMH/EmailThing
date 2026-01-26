function makeCRCTable() {
    let c: number;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[n] = c;
    }
    return crcTable;
}
const crcTable = makeCRCTable();

function crc32(str: string) {
    let crc = 0 ^ -1;

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        crc = (crc >>> 8) ^ (crcTable[(crc ^ char) & 0xff] ?? 0);
    }

    return (crc ^ -1) >>> 0;
}

function generateChecksum(token: string) {
    // Calculate checksum using CRC32 algorithm
    let checksum = crc32(token) >>> 0; // Ensure it's an unsigned 32-bit integer
    // Encode checksum using Base62
    const base62Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let encodedChecksum = "";
    while (checksum > 0) {
        encodedChecksum = base62Chars.charAt(checksum % 62) + encodedChecksum;
        checksum = Math.floor(checksum / 62);
    }
    // Pad with leading zeros if needed to ensure 6 digits
    return encodedChecksum.padStart(6, "0");
}

function generateRandomToken(length = 30) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const charsetLength = charset.length;
    const maxValidValue = 256 - (256 % charsetLength); // Ensure no bias

    let token = "";
    while (token.length < length) {
        const randomValues = crypto.getRandomValues(new Uint8Array(length)); // Generate multiple random bytes
        for (let i = 0; i < randomValues.length && token.length < length; i++) {
            const randomValue = randomValues[i]!;
            if (randomValue < maxValidValue) {
                token += charset[randomValue % charsetLength];
            }
        }
    }

    return token;
}

export function generateToken() {
    const prefix = "et_";
    const random = generateRandomToken(30);
    const checksum = generateChecksum(random);

    return `${prefix}_${random}${checksum}`;
}

export function generateSessionToken() {
    const prefix = "ets";
    const random = generateRandomToken(50);
    const checksum = generateChecksum(random);

    return `${prefix}_${random}${checksum}`;
}

export function generateRefreshToken() {
    const prefix = "etr";
    const random = generateRandomToken(50);
    const checksum = generateChecksum(random);

    return `${prefix}_${random}${checksum}`;
}

/** Function to verify last 6 digit checksum (works on emailthing and github tokens) */
export function verifyTokenChecksum(token: string) {
    // const regex = (?<prefix>et_)_(?<random>[A-Za-z0-9]{30})(?<checksum>[A-Za-z0-9]{6})
    const regex = /^(?<prefix>[a-z_]{3})_(?<random>[A-Za-z0-9]{30,50})(?<checksum>[A-Za-z0-9]{6})$/;
    const match = token.match(regex);
    if (!match?.groups) return false;

    const { prefix, random, checksum } = match.groups;
    if (!prefix || !random || !checksum) return false;

    return checksum === generateChecksum(random);
}
