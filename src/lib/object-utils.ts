/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Get a nested property from an object using a dot-notation path
 * Equivalent to lodash's _.get() function
 *
 * @param object - The object to query
 * @param path - The path of the property to get (supports dot notation like 'a.b.c')
 * @param defaultValue - The value returned for undefined resolved values
 * @returns The resolved value or defaultValue if not found
 *
 * @example
 * const obj = { a: { b: { c: 42 } } }
 * get(obj, 'a.b.c') // 42
 * get(obj, 'a.b.d', 'default') // 'default'
 * get(obj, 'a.b.c.d.e') // undefined
 */
export function get<T = any>(
  object: any,
  path: string | string[],
  defaultValue?: T,
): T | undefined {
  if (object == null) {
    return defaultValue
  }

  // Convert string path to array if needed
  const pathArray = Array.isArray(path) ? path : path.split('.')

  let result = object

  for (const key of pathArray) {
    if (result == null || typeof result !== 'object') {
      return defaultValue
    }
    result = result[key]
  }

  return result !== undefined ? result : defaultValue
}

/**
 * Check if a nested property exists in an object using a dot-notation path
 *
 * @param object - The object to check
 * @param path - The path of the property to check (supports dot notation like 'a.b.c')
 * @returns True if the property exists and is not undefined
 *
 * @example
 * const obj = { a: { b: { c: 42 } } }
 * has(obj, 'a.b.c') // true
 * has(obj, 'a.b.d') // false
 */
export function has(object: any, path: string | string[]): boolean {
  if (object == null) {
    return false
  }

  const pathArray = Array.isArray(path) ? path : path.split('.')
  let current = object

  for (const key of pathArray) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return false
    }
    current = current[key]
  }

  return true
}
