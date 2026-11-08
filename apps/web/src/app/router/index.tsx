import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { StudioPage } from '@/features/studio';
import {
  ModelLibraryPage,
  ModelDetailPage,
  ModelEditPage,
  ModelCreateWizardPage,
} from '@/features/models';
import { LibraryPage, TemplateDetailPage } from '@/features/library';
import { NotFoundPage } from '@/components/layout/NotFoundPage';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/studio" replace />,
      },
      {
        path: 'overview',
        element: <Navigate to="/studio" replace />,
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
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
