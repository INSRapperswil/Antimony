import AdminPage from '@sb/components/AdminPage/AdminPage';
import SBConfirm, {SBConfirmRef} from '@sb/components/common/SBConfirm';

import './App.sass';
import Dock from '@sb/components/Dock/Dock';
import LabsPage from '@sb/components/LabsPage/LabsPage';
import LoginOverlay from '@sb/components/LoginOverlay/LoginOverlay';

import {
  NotificationController,
  NotificationControllerContext,
} from '@sb/lib/NotificationController';
import {rootStore, RootStoreContext} from '@sb/lib/stores/RootStore';
import {If} from '@sb/types/control';
import {observer} from 'mobx-react-lite';
import {PrimeReactProvider} from 'primereact/api';

import {Toast} from 'primereact/toast';
import React, {useContext, useRef} from 'react';

import {Navigate, Route, Routes} from 'react-router-dom';
import 'primereact/resources/themes/lara-dark-blue/theme.css';

const App: React.FC = observer(() => {
  const toastRef = useRef<Toast>(null);
  const confirmationRef = useRef<SBConfirmRef>(null);

  const apiStore = useContext(RootStoreContext).apiConnectorStore;

  return (
    <PrimeReactProvider>
      <RootStoreContext.Provider value={rootStore}>
        <NotificationControllerContext.Provider
          value={new NotificationController(toastRef, confirmationRef)}
        >
          <LoginOverlay />
          <div className="flex flex-column flex-grow-1 m-3 sb-app-container">
            <If condition={apiStore.isLoggedIn}>
              <Dock />
              <div className="flex flex-grow-1 gap-2 min-h-0">
                <Routes>
                  <Route path="/" element={<LabsPage />} />
                  <Route path="/editor" element={<AdminPage />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </If>
          </div>
        </NotificationControllerContext.Provider>
      </RootStoreContext.Provider>
      <SBConfirm ref={confirmationRef} />
      <Toast ref={toastRef} />
    </PrimeReactProvider>
  );
});

export default App;
