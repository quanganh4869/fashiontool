import { config } from '@/app/config/env';

/**
 * Basic HTTP client wrapper for communication with TrendMotion API.
 * Full business endpoints will be implemented in subsequent phases.
 */
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const base = config.apiUrl.replace(/\/+$/, '');
  let normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Avoid duplicate /api/v1 if base already includes it
  if (base.endsWith('/api/v1') && normalizedPath.startsWith('/api/v1/')) {
    normalizedPath = normalizedPath.substring(7); // remove leading /api/v1
  }

  const url = `${base}${normalizedPath}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Request Error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
