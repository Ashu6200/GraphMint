import crypto from 'node:crypto';

function escapeRegExp(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function slugify(text, options = {}) {
  const { separator = '-', lowercase = true, strict = true, transliterate = false } = options;

  let value = String(text ?? '').trim();

  if (transliterate) {
    value = value.normalize('NFKD').replace(/\p{Diacritic}/gu, '');
  }

  if (lowercase) {
    value = value.toLowerCase();
  }
  value = value.replace(/['"`]/g, '').replace(/\s+/g, separator);

  if (strict) {
    value = value.replace(new RegExp(`[^a-zA-Z0-9${escapeRegExp(separator)}]`, 'g'), '');
  }

  const escapedSeparator = escapeRegExp(separator);

  value = value
    .replace(new RegExp(`${escapedSeparator}{2,}`, 'g'), separator)
    .replace(new RegExp(`^${escapedSeparator}+|${escapedSeparator}+$`, 'g'), '');

  return value;
}

export function randomString(length = 8, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
  if (!Number.isInteger(length) || length < 1) {
    throw new TypeError('length must be a positive integer');
  }

  if (!alphabet || alphabet.length < 2) {
    throw new TypeError('alphabet must contain at least 2 characters');
  }

  const bytes = crypto.randomBytes(length);

  let result = '';

  for (let i = 0; i < length; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }

  return result;
}

export function generateSlug(text, options = {}) {
  const {
    prefix = 'GM',
    random = true,
    randomLength = 8,
    suffix,
    separator = '-',
    lowercase = true,
    camelCase = false,
    ...slugifyOptions
  } = options;

  let slug = slugify(text, {
    separator,
    lowercase,
    ...slugifyOptions,
  });

  if (!slug) {
    slug = randomString(randomLength);
  }

  if (prefix) {
    slug = `${prefix}${separator}${slug}`;
  }

  if (suffix) {
    slug = `${slug}${separator}${suffix}`;
  }

  if (random) {
    slug = `${slug}${separator}${randomString(randomLength)}`;
  }

  if (camelCase) {
    slug = slug.replace(/-([a-zA-Z0-9])/g, (_, char) => char.toUpperCase());
  }

  return slug;
}

export async function generateUniqueSlug(text, options = {}) {
  const { exists, maxAttempts = 10, ...slugOptions } = options;

  if (typeof exists !== 'function') {
    throw new TypeError('generateUniqueSlug requires an `exists` function');
  }

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new TypeError('maxAttempts must be a positive integer');
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = generateSlug(text, {
      ...slugOptions,
      random: slugOptions.random ?? true,
    });

    if (!(await exists(slug))) {
      return slug;
    }
  }

  throw new Error(`Unable to generate a unique slug after ${maxAttempts} attempts`);
}

export default {
  slugify,
  randomString,
  generateSlug,
  generateUniqueSlug,
};
