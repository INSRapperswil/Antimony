import React from 'react';

import {Button} from 'primereact/button';
import {useNavigate} from 'react-router-dom';

import './Dock.sass';

const Dock: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className=" flex mb-3 align-items-center justify-content-between sb-card p-2 sb-dock">
      <div className="flex align-items-center gap-2">
        <div className="sb-logo-tab sb-corner-tab flex justify-content-center align-items-center">
          <div>Logo Here</div>
        </div>
        <Button label="Dashboard" outlined onClick={() => navigate('/')} />
        <Button
          label="Topology Editor"
          outlined
          onClick={() => navigate('/admin')}
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
          tooltipOptions={{position: 'bottom'}}
        />
      </div>
    </div>
  );
};

export default Dock;
