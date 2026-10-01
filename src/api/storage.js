const PREFIX = "zoho-demo-v2:";

export function readStorage(
  key,
  fallback,
  validate = () => true,
  session = false,
) {
  try {
    const value = JSON.parse(
      (session ? sessionStorage : localStorage).getItem(PREFIX + key),
    );
    return value !== null && validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value, session = false) {
  try {
    const storage = session ? sessionStorage : localStorage;
    if (value === null) storage.removeItem(PREFIX + key);
    else storage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
