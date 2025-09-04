import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { StarknetProvider } from './providers/StarknetProvider';
import { router } from './router';
import './index.css';
// Import Mantine styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Notifications } from '@mantine/notifications';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <Notifications />
      <StarknetProvider>
        <RouterProvider router={router} />
      </StarknetProvider>
    </MantineProvider>
  </StrictMode>
);
