import {useAPIStore} from '@sb/lib/stores/root-store';
import React from 'react';

import {Button} from 'primereact/button';
import {useNavigate} from 'react-router-dom';

import './sb-dock.sass';

const SBDock: React.FC = () => {
  const navigate = useNavigate();

  const apiStore = useAPIStore();

  return (
    <div className="flex mb-3 align-items-stretch justify-content-between sb-card sb-dock">
      <div className="flex align-items-center gap-2">
        <div className="sb-logo-tab sb-corner-tab flex justify-content-center align-items-center">
          <div>Logo Here</div>
        </div>
        <Button label="Dashboard" outlined onClick={() => navigate('/')} />
        <Button
          label="Topology Editor"
          outlined
          onClick={() => navigate('/editor')}
        />
      </div>
      <div className="flex align-items-center gap-2 justify-content-end">
        <Button
          outlined
          icon="pi pi-calendar"
          size="large"
          tooltip="Lab Schedule"
          tooltipOptions={{position: 'bottom'}}
        />
        <Button
          outlined
          icon="pi pi-sun"
          size="large"
          tooltip="Theme"
          tooltipOptions={{position: 'bottom'}}
        />
        <Button
          outlined
          icon="pi pi-github"
          size="large"
          tooltip="Anomaly GitHub"
          tooltipOptions={{position: 'bottom'}}
        />
        <Button
          outlined
          icon="pi pi-sign-out"
          label="Log Out"
          className="flex gap-1"
          onClick={() => apiStore.logout()}
          tooltipOptions={{position: 'bottom'}}
        />
      </div>
    </div>
  );
};

export default SBDock;
