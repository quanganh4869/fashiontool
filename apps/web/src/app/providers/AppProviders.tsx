import React, { PropsWithChildren } from 'react';
import { ToastProvider } from '@/components/feedback/Toast';

/**
 * Global App Providers wrapper.
 * Houses ToastProvider, ThemeProvider, QueryClientProvider, and future AuthProvider.
 */
export const AppProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return <ToastProvider>{children}</ToastProvider>;
};
