import ErrorPage from '@sb/components/error-page/error-page';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

import App from '@sb/app';

import '@sb/theme/sb-base.sass';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';

/*
 * We want to register the workbox service worker before loading the web-app.
 */
if (process.env.NODE_ENV === 'production') {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('[SW] Worker registered: ', registration);
        })
        .catch(registrationError => {
          console.error('[SW] Worker registration failed: ', registrationError);
        });
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider
      router={createBrowserRouter([
        {
          path: '*',
          element: <App />,
          errorElement: <ErrorPage isVisible={true} />,
        },
      ])}
    />
  </React.StrictMode>
);
