import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { StarknetProvider } from './providers/StarknetProvider';
import { router } from './router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StarknetProvider>
      <RouterProvider router={router} />
    </StarknetProvider>
  </StrictMode>
);
