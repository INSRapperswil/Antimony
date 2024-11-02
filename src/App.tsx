import SBConfirm, {SBConfirmRef} from '@sb/components/common/SBConfirm';
import React, {useRef, useState} from 'react';

import {PrimeReactProvider} from 'primereact/api';

import Dock from '@sb/components/Dock/Dock';
import {Choose, If, When} from '@sb/types/control';
import AdminPage from '@sb/components/AdminPage/AdminPage';

import 'primereact/resources/themes/lara-dark-blue/theme.css';
import {APIConnector} from '@sb/lib/APIConnector';
import {Toast} from 'primereact/toast';
import {NotificationController} from '@sb/lib/NotificationController';
import {useReady, useSingleton} from '@sb/lib/utils/Hooks';

import './App.sass';
import LabsPage from '@sb/components/LabsPage/LabsPage';

const App: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0); //starting page

  const [isAuthenticated, setAuthenticated] = useState(false);

  const apiConnector = useSingleton(APIConnector);

  const toastRef = useRef<Toast>(null);
  const confirmationRef = useRef<SBConfirmRef>(null);

  const [notificationController] = useState<NotificationController>(
    new NotificationController(toastRef, confirmationRef)
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
                <LabsPage apiConnector={apiConnector!} />
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
      <SBConfirm ref={confirmationRef} />
      <Toast ref={toastRef} />
    </PrimeReactProvider>
  );
};

export default App;
