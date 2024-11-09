import SBConfirm, {
  SBConfirmRef,
} from '@sb/components/common/sb-confirm/sb-confirm';

import './app.sass';
import SBDock from '@sb/components/common/sb-dock/sb-dock';
import SBLogin from '@sb/components/common/sb-login/sb-login';
import SBStatusIndicator from '@sb/components/common/sb-status-indicator/sb-status-indicator';
import DashboardPage from '@sb/components/dashboard-page/dashboard-page';
import EditorPage from '@sb/components/editor-page/editor-page';
import ErrorPage from '@sb/components/error-page/error-page';

import {
  RootStoreContext,
  useAPIStore,
  useNotifications,
  useRootStore,
} from '@sb/lib/stores/root-store';
import {If} from '@sb/types/control';
import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import {PrimeReactProvider} from 'primereact/api';

import {Toast} from 'primereact/toast';
import React, {useEffect, useRef, useState} from 'react';

import {Route, Routes} from 'react-router-dom';
import 'primereact/resources/themes/lara-dark-blue/theme.css';

const App: React.FC = observer(() => {
  const toastRef = useRef<Toast>(null);
  const confirmationRef = useRef<SBConfirmRef>(null);

  const rootStore = useRootStore();
  const apiStore = useAPIStore();
  const notificationStore = useNotifications();

  const [doneLoading, setDoneLoading] = useState(false);

  useEffect(() => {
    if (!notificationStore) return;

    notificationStore.setToast(toastRef);
    notificationStore.setConfirm(confirmationRef);
  }, [notificationStore]);

  useEffect(() => {
    if (!apiStore.isLoggedIn) setDoneLoading(false);
  }, [apiStore.isLoggedIn]);

  return (
    <PrimeReactProvider>
      <RootStoreContext.Provider value={rootStore}>
        <SBLogin />
        <div
          className={classNames('sb-app-container', 'sb-animated-overlay', {
            visible: doneLoading,
          })}
        >
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
                      isVisible={true}
                    />
                  }
                />
              </Routes>
            </div>
          </If>
        </div>
        <SBStatusIndicator setDoneLoading={() => setDoneLoading(true)} />
      </RootStoreContext.Provider>
      <SBConfirm ref={confirmationRef} />
      <Toast ref={toastRef} position="bottom-right" />
    </PrimeReactProvider>
  );
});

export default App;
