import EditorPage from '@sb/components/editor-page/editor-page';
import SBConfirm, {
  SBConfirmRef,
} from '@sb/components/common/sb-confirm/sb-confirm';

import './app.sass';
import SBDock from '@sb/components/common/sb-dock/sb-dock';
import DashboardPage from '@sb/components/dashboard-page/dashboard-page';
import ErrorPage from '@sb/components/error-page/error-page';
import SBLogin from '@sb/components/common/sb-login/sb-login';

import {
  rootStore,
  RootStoreContext,
  useAPIStore,
  useNotifications,
} from '@sb/lib/stores/root-store';
import {Choose, When} from '@sb/types/control';
import {observer} from 'mobx-react-lite';
import {PrimeReactProvider} from 'primereact/api';

import {Toast} from 'primereact/toast';
import React, {useEffect, useRef} from 'react';

import {Route, Routes} from 'react-router-dom';
import 'primereact/resources/themes/lara-dark-blue/theme.css';

const App: React.FC = observer(() => {
  const toastRef = useRef<Toast>(null);
  const confirmationRef = useRef<SBConfirmRef>(null);

  const apiStore = useAPIStore();
  const notificationStore = useNotifications();

  useEffect(() => {
    if (!notificationStore) return;

    notificationStore.setToast(toastRef);
    notificationStore.setConfirm(confirmationRef);
  }, [notificationStore]);

  return (
    <PrimeReactProvider>
      <RootStoreContext.Provider value={rootStore}>
        <SBLogin />
        <div className="flex flex-column flex-grow-1 m-3 sb-app-container">
          <Choose>
            <When condition={apiStore.hasNetworkError}>
              <ErrorPage
                code="NETERR"
                message="Failed to connect to the Antimony backend."
              />
            </When>
            <When condition={apiStore.isLoggedIn}>
              <SBDock />
              <div className="flex flex-grow-1 gap-2 min-h-0">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/editor" element={<EditorPage />} />
                  <Route
                    path="*"
                    element={
                      <ErrorPage
                        code="404"
                        message="This page does not exist"
                      />
                    }
                  />
                </Routes>
              </div>
            </When>
          </Choose>
        </div>
      </RootStoreContext.Provider>
      <SBConfirm ref={confirmationRef} />
      <Toast ref={toastRef} position="bottom-right" />
    </PrimeReactProvider>
  );
});

export default App;
