import Cookies from 'js-cookie';

/**
 * Parses a cookie to a boolean.
 *
 * Returns null if the cookie was not defined. Returns false if the cookie was invalid.
 *
 * @param key The key to the cookie.
 */
export function readBool(key: string): boolean | null {
  const value = Cookies.get(key);
  if (!value) return null;

  return Cookies.get(key) === 'true';
}

/**
 * Parses a cookie to an integer.
 *
 * Returns null if the cookie was not defined or invalid.
 *
 * @param key The key to the cookie.
 */
export function readInt(key: string): number | null {
  const value = Cookies.get(key);
  if (!value) return null;

  const number = parseInt(value);
  return isNaN(number) ? null : number;
}

/**
 * Parses a cookie to a float.
 *
 * Returns null if the cookie was not defined or invalid.
 *
 * @param key The key to the cookie.
 */
export function readFloat(key: string): number | null {
  const value = Cookies.get(key);
  if (!value) return null;

  const number = parseFloat(value);
  return isNaN(number) ? null : number;
}
