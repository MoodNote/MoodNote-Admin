/**
 * Truncate string to maxLength, appending "..."
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '...'
}

/**
 * Capitalize first letter: "hello" → "Hello"
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Capitalize each word: "hello world" → "Hello World"
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Convert to URL-friendly slug: "Hello World!" → "hello-world"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
}

/**
 * Get initials from a name: "Nguyen Van A" → "NVA"
 */
export function getInitials(name: string, limit = 3): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, limit)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}
