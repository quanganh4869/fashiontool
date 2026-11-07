/**
 * Pure utility functions for TrendMotion Studio Web
 */

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
