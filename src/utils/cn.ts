/**
 * Joins class names, filtering out falsy values.
 * @example cn('btn', isActive && 'btn--active', undefined) → "btn btn--active"
 */
export function cn(
  ...classes: (string | boolean | null | undefined)[]
): string {
  return classes.filter(Boolean).join(' ')
}
