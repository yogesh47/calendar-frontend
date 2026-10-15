/**
 * Utility functions for className merging
 * Using clsx and tailwind-merge for optimal class handling
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind CSS conflict resolution
 * @param {...ClassValue[]} inputs - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
