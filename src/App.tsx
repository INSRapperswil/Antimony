import SBConfirm, {SBConfirmRef} from '@sb/components/common/SBConfirm';
import {
  NotificationController,
  NotificationControllerContext,
} from '@sb/lib/NotificationController';
import {rootStore, RootStoreContext} from '@sb/lib/stores/RootStore';
import React, {useRef} from 'react';

import {PrimeReactProvider} from 'primereact/api';

import Dock from '@sb/components/Dock/Dock';
import AdminPage from '@sb/components/AdminPage/AdminPage';

import 'primereact/resources/themes/lara-dark-blue/theme.css';
import {Toast} from 'primereact/toast';

import './App.sass';
import LabsPage from '@sb/components/LabsPage/LabsPage';
import {BrowserRouter, Route, Routes} from 'react-router-dom';

const App: React.FC = () => {
  const toastRef = useRef<Toast>(null);
  const confirmationRef = useRef<SBConfirmRef>(null);

  return (
    <PrimeReactProvider>
      <RootStoreContext.Provider value={rootStore}>
        <NotificationControllerContext.Provider
          value={new NotificationController(toastRef, confirmationRef)}
        >
          <BrowserRouter>
            <div className="flex flex-column flex-grow-1 m-3 sb-app-container">
              <Dock />
              <div className="flex flex-grow-1 gap-2 min-h-0">
                <Routes>
                  <Route path="/" element={<LabsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </div>
            </div>
          </BrowserRouter>
        </NotificationControllerContext.Provider>
      </RootStoreContext.Provider>
      <SBConfirm ref={confirmationRef} />
      <Toast ref={toastRef} />
    </PrimeReactProvider>
  );
};

export default App;
