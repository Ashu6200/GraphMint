import crypto from 'node:crypto';

function get({ secretKey }) {
    const ALGO = 'aes-256-gcm';
    const KEY = Buffer.from(secretKey, 'hex');
    const IV_LENGTH = 12;

    const encrypt = (plainText) => {
        if (!plainText) return plainText;

        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGO, KEY, iv);

        const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);

        const authTag = cipher.getAuthTag();

        return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
    };

    const decrypt = (encryptedValue) => {
        if (!encryptedValue) return encryptedValue;

        const [ivHex, tagHex, dataHex] = encryptedValue.split(':');

        const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(ivHex, 'hex'));

        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(dataHex, 'hex')),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    };

    const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

    const hashEmail = (email) => hashValue(email.toLowerCase().trim());

    const normalizePhone = (phone) =>
        phone
            .replace(/\D/g, '') // remove non-digits
            .replace(/^0+/, '') // remove leading zeros
            .replace(/^91/, '+91'); // ensure country code (India)

    const hashPhone = (phone) => hashValue(normalizePhone(phone));

    const isHex = (value) =>
        typeof value === 'string' && value.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(value);

    function base64encrypt(value) {
        if (value === null || value === undefined) return value;

        const encoding = isHex(value) ? 'hex' : 'utf8';
        const prefix = encoding === 'hex' ? 'h' : 't';

        const encoded = Buffer.from(value, encoding)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        return `${prefix}:${encoded}`;
    }

    function base64decrypt(encodedValue) {
        if (!encodedValue || typeof encodedValue !== 'string') return encodedValue;

        const [prefix, shortValue] = encodedValue.split(':');
        if (!prefix || !shortValue) return encodedValue;

        const base64 = shortValue
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(shortValue.length + ((4 - (shortValue.length % 4)) % 4), '=');

        const buffer = Buffer.from(base64, 'base64');

        if (prefix === 'h') return buffer.toString('hex');
        if (prefix === 't') return buffer.toString('utf8');

        return encodedValue;
    }

    return {
        base64decrypt,
        base64encrypt,
        isHex,
        hashEmail,
        hashPhone,
        hashValue,
        encrypt,
        decrypt,
    };
}

export function generateEncryptionKey(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

export default {
    get,
    generateEncryptionKey,
};

