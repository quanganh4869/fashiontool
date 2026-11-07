import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { OverviewPage } from '@/features/overview';
import { ProductResearchPage } from '@/features/product-research';
import { ChannelAnalysisPage } from '@/features/channel-analysis';
import { StudioPage } from '@/features/studio';
import {
  ModelLibraryPage,
  ModelDetailPage,
  ModelEditPage,
  ModelCreateWizardPage,
} from '@/features/models';
import { LibraryPage, TemplateDetailPage } from '@/features/library';
import { CreditWalletPage } from '@/features/credit-wallet';
import { SettingsPage } from '@/features/settings';
import { NotFoundPage } from '@/components/layout/NotFoundPage';
import { DesignPreviewPage } from './DesignPreviewPage';

const isDev = import.meta.env.DEV;

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/overview" replace />,
      },
      {
        path: 'overview',
        element: <OverviewPage />,
      },
      {
        path: 'products',
        element: <ProductResearchPage />,
      },
      {
        path: 'products/:productId',
        element: <ProductResearchPage />,
      },
      {
        path: 'channels',
        element: <ChannelAnalysisPage />,
      },
      {
        path: 'studio',
        element: <StudioPage />,
      },
      {
        path: 'studio/:projectId',
        element: <StudioPage />,
      },
      {
        path: 'studio/:projectId/:step',
        element: <StudioPage />,
      },
      {
        path: 'models',
        element: <ModelLibraryPage />,
      },
      {
        path: 'models/:modelId',
        element: <ModelDetailPage />,
      },
      {
        path: 'models/:modelId/edit',
        element: <ModelEditPage />,
      },
      {
        path: 'models/:modelId/setup/identity',
        element: <ModelCreateWizardPage />,
      },
      {
        path: 'models/:modelId/setup/photos',
        element: <ModelCreateWizardPage />,
      },
      {
        path: 'models/:modelId/setup/review',
        element: <ModelCreateWizardPage />,
      },
      {
        path: 'library',
        element: <LibraryPage />,
      },
      {
        path: 'library/:templateId',
        element: <TemplateDetailPage />,
      },
      {
        path: 'templates',
        element: <Navigate to="/library" replace />,
      },
      {
        path: 'templates/:templateId',
        element: <TemplateDetailPage />,
      },
      {
        path: 'wallet',
        element: <CreditWalletPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      // Development-only Design System Playground
      ...(isDev
        ? [
            {
              path: '__design-preview',
              element: <DesignPreviewPage />,
            },
          ]
        : []),
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
