import React, {useRef, useState} from 'react';

import {PrimeReactProvider} from 'primereact/api';

import Dock from '@sb/components/Dock/Dock';
import {Choose, If, When} from '@sb/types/control';
import LabsPage from '@sb/components/LabsPage';
import AdminPage from '@sb/components/AdminPage/AdminPage';

import 'primereact/resources/themes/lara-dark-blue/theme.css';
import {APIConnector} from '@sb/lib/APIConnector';
import {Toast} from 'primereact/toast';
import {NotificationController} from '@sb/lib/NotificationController';
import {useReady, useSingleton} from '@sb/lib/Hooks';

import './App.sass';

const App: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [isAuthenticated, setAuthenticated] = useState(false);

  const apiConnector = useSingleton(APIConnector);

  const toastRef = useRef<Toast>(null);

  const [notificationController] = useState<NotificationController>(
    new NotificationController(toastRef)
  );

  // This ensures that the page is only rendered after all the necessary singletons have been instantiated
  const isReady = useReady(notificationController, apiConnector);

  return (
    <PrimeReactProvider>
      <If condition={isReady}>
        <div className="flex flex-column flex-grow-1 m-3 sb-app-container">
          <Dock onPageSwitch={setPageIndex} />
          <div className="flex flex-grow-1 gap-2 min-h-0">
            <Choose>
              <When condition={pageIndex === 0}>
                <LabsPage />
              </When>
              <When condition={pageIndex === 1}>
                <AdminPage
                  apiConnector={apiConnector!}
                  notificationController={notificationController}
                />
              </When>
            </Choose>
          </div>
        </div>
      </If>
      <Toast ref={toastRef} />
    </PrimeReactProvider>
  );
};

export default App;
