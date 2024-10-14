import React, {useEffect, useState} from 'react';

import {PrimeReactProvider} from 'primereact/api';

import Dock from '@sb/components/Dock/Dock';
import {Choose, When} from '@sb/types/control';
import LabsPage from '@sb/components/LabsPage';
import AdminPage from '@sb/components/AdminPage/AdminPage';

import 'primereact/resources/themes/lara-dark-blue/theme.css';
import {APIConnector} from '@sb/lib/APIConnector';

const App: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [apiConnector, setApiConnector] = useState(new APIConnector());

  const [isAuthenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setApiConnector(new APIConnector());
  }, []);

  // const [searchParams, setSearchParams] = useSearchParams();

  return (
    <PrimeReactProvider>
      <div className="flex flex-column flex-grow-1 m-3">
        <Dock onPageSwitch={setPageIndex} />
        <div className="flex flex-grow-1 gap-2 min-h-0">
          <Choose>
            <When condition={pageIndex === 0}>
              <LabsPage />
            </When>
            <When condition={pageIndex === 1}>
              <AdminPage apiConnector={apiConnector} />
            </When>
          </Choose>
        </div>
      </div>
    </PrimeReactProvider>
  );
};

export default App;
