import { createHash } from 'crypto';

/**
 * Generates a deterministic random number between 0 and 1 based on a seed string.
 * Uses SHA-256 hash and takes the first 8 characters (32 bits) for the value.
 * 
 * @param seed The seed string to use for generation.
 * @returns A float between 0 (inclusive) and 1 (exclusive).
 */
export function getDeterministicRandom(seed: string): number {
  const hash = createHash('sha256').update(seed).digest('hex');
  // Use the first 8 characters (32 bits) to get a float between 0 and 1
  return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
}
