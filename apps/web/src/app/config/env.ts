export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
} as const;
