import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { Home } from './pages/Home';
import { Lottery } from './pages/Lottery';
import { History } from './pages/History';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'lottery',
        element: <Lottery />,
      },
      {
        path: 'history',
        element: <History />,
      },
    ],
  },
]);
