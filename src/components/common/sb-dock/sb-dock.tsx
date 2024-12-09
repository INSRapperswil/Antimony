import React, {useRef, useState} from 'react';

import {Badge} from 'primereact/badge';
import {Button} from 'primereact/button';
import {observer} from 'mobx-react-lite';
import {useNavigate} from 'react-router-dom';
import {OverlayPanel} from 'primereact/overlaypanel';

import {If} from '@sb/types/control';
import {useAPIStore, useNotifications} from '@sb/lib/stores/root-store';
import NotificationPanel from './notification-panel/notification-panel';

import './sb-dock.sass';
import CalendarDialog from '@sb/components/Calendar/calender-dialog';

const SBDock: React.FC = observer(() => {
  const navigate = useNavigate();

  const apiStore = useAPIStore();
  const notificationStore = useNotifications();

  const overlayRef = useRef<OverlayPanel>(null);

  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  function CloseCalendar() {
    setShowCalendar(false);
  }

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
          icon="pi pi-bell"
          size="large"
          onClick={e => overlayRef.current?.toggle(e)}
          pt={{
            icon: {
              className: 'p-overlay-badge',
              children: (
                <If condition={notificationStore.unreadMessages > 0}>
                  <Badge severity="danger" />
                </If>
              ),
            },
          }}
        />
        <Button
          outlined
          icon="pi pi-calendar"
          size="large"
          tooltip="Lab Schedule"
          tooltipOptions={{position: 'bottom'}}
          onClick={() => setShowCalendar(true)}
        />
        <If condition={showCalendar}>
          <CalendarDialog isOpen={showCalendar} onClose={CloseCalendar} />
        </If>
        <Button
          outlined
          icon="pi pi-sign-out"
          label="Log Out"
          className="flex gap-1"
          onClick={() => apiStore.logout()}
          tooltipOptions={{position: 'bottom'}}
        />
      </div>

      <NotificationPanel ref={overlayRef} />
    </div>
  );
});

export default SBDock;
