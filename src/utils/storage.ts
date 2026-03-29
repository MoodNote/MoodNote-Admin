/**
 * Type-safe localStorage wrapper
 */
export const storage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return null
      return JSON.parse(item) as T
    } catch {
      return null
    }
  },

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Silently fail (e.g. private browsing storage quota exceeded)
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key)
  },

  getString(key: string): string | null {
    return localStorage.getItem(key)
  },

  setString(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Silently fail (e.g. private browsing storage quota exceeded)
    }
  },

  removeMany(keys: string[]): void {
    keys.forEach((key) => localStorage.removeItem(key))
  },

  clear(): void {
    localStorage.clear()
  },
}
