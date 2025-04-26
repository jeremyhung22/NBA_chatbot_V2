/**
 * Budget configuration for NBA Team Builder application.
 * This file serves as a single source of truth for budget settings.
 */

// Default budget in dollars
export const DEFAULT_BUDGET = 20000000; // $20,000,000

// Minimum allowed budget in dollars 
export const MIN_BUDGET = 1000000;  // $1,000,000

// Maximum allowed budget in dollars
export const MAX_BUDGET = 500000000; // $500,000,000

// Export as default for simpler imports
export default {
  DEFAULT_BUDGET,
  MIN_BUDGET,
  MAX_BUDGET
};