/**
 * Returns the API key from environment variables.
 */
export function getApiKey(): string {
  return import.meta.env.VITE_API_KEY || '';
}
