import EditorPage from '@sb/components/editor-page/editor-page';
import SbConfirm, {
  SBConfirmRef,
} from '@sb/components/common/sb-confirm/sb-confirm';

import './app.sass';
import SBDock from '@sb/components/common/sb-dock/sb-dock';
import DashboardPage from '@sb/components/dashboard-page/dashboard-page';
import ErrorPage from '@sb/components/error-page/error-page';
import SBLogin from '@sb/components/common/sb-login/sb-login';

import {
  NotificationController,
  NotificationControllerContext,
} from '@sb/lib/notification-controller';
import {
  rootStore,
  RootStoreContext,
  useAPIStore,
} from '@sb/lib/stores/root-store';
import {If} from '@sb/types/control';
import {observer} from 'mobx-react-lite';
import {PrimeReactProvider} from 'primereact/api';

import {Toast} from 'primereact/toast';
import React, {useRef} from 'react';

import {Route, Routes} from 'react-router-dom';
import 'primereact/resources/themes/lara-dark-blue/theme.css';

const App: React.FC = observer(() => {
  const toastRef = useRef<Toast>(null);
  const confirmationRef = useRef<SBConfirmRef>(null);

  const apiStore = useAPIStore();

  return (
    <PrimeReactProvider>
      <RootStoreContext.Provider value={rootStore}>
        <NotificationControllerContext.Provider
          value={new NotificationController(toastRef, confirmationRef)}
        >
          <SBLogin />
          <div className="flex flex-column flex-grow-1 m-3 sb-app-container">
            <If condition={apiStore.isLoggedIn}>
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
            </If>
          </div>
        </NotificationControllerContext.Provider>
      </RootStoreContext.Provider>
      <SbConfirm ref={confirmationRef} />
      <Toast ref={toastRef} />
    </PrimeReactProvider>
  );
});

export default App;
