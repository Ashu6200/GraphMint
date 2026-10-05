export function safeJsonParse(data) {
  try {
    return JSON.parse(data);
  } catch {
    return false;
  }
}

export const parseJSON = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
};

export default {
  safeJsonParse,
  parseJSON,
};
