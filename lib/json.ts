export const parseJsonMaybe = <T = Record<string, unknown>>(value: unknown): T | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    return (typeof value === 'object' ? (value as T) : null);
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const stringifyJson = (value: unknown): string => {
  try {
    const json = JSON.stringify(value);
    return json ?? '{}';
  } catch {
    return '{}';
  }
};
