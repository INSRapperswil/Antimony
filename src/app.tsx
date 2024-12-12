import SBConfirm, {
  SBConfirmRef,
} from '@sb/components/common/sb-confirm/sb-confirm';
import SBDock from '@sb/components/common/sb-dock/sb-dock';
import ErrorPage from '@sb/components/error-page/error-page';
import SBLogin from '@sb/components/common/sb-login/sb-login';
import EditorPage from '@sb/components/editor-page/editor-page';
import DashboardPage from '@sb/components/dashboard-page/dashboard-page';
import SBStatusIndicator from '@sb/components/common/sb-status-indicator/sb-status-indicator';

import './app.sass';

import {
  RootStoreContext,
  useDataBinder,
  useNotifications,
  useRootStore,
} from '@sb/lib/stores/root-store';
import {Choose, If, Otherwise, When} from '@sb/types/control';
import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import {PrimeReactProvider} from 'primereact/api';

import {Toast} from 'primereact/toast';
import React, {useEffect, useRef, useState} from 'react';

import {Route, Routes} from 'react-router';
import 'primereact/resources/themes/lara-dark-blue/theme.css';

const App: React.FC = observer(() => {
  const toastRef = useRef<Toast>(null);
  const confirmationRef = useRef<SBConfirmRef>(null);

  const rootStore = useRootStore();
  const dataBinder = useDataBinder();
  const notificationStore = useNotifications();

  const [doneLoading, setDoneLoading] = useState(false);

  useEffect(() => {
    if (!notificationStore) return;

    notificationStore.setToast(toastRef);
    notificationStore.setConfirm(confirmationRef);
  }, [notificationStore]);

  useEffect(() => {
    if (!dataBinder.isLoggedIn) setDoneLoading(false);
  }, [dataBinder.isLoggedIn]);

  return (
    <PrimeReactProvider>
      <RootStoreContext.Provider value={rootStore}>
        <SBLogin />
        <div
          className={classNames('sb-app-container', 'sb-animated-overlay', {
            visible: doneLoading,
          })}
        >
          <If condition={dataBinder.isLoggedIn}>
            <If condition={process.env.IS_ONLINE}>
              <SBDock />
            </If>
            <div className="flex flex-grow-1 gap-2 min-h-0">
              <Routes>
                <Choose>
                  <When condition={process.env.IS_ONLINE}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/editor" element={<EditorPage />} />
                  </When>
                  <Otherwise>
                    <Route path="/" element={<EditorPage />} />
                    <Route path="/editor" element={<EditorPage />} />
                  </Otherwise>
                </Choose>

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
