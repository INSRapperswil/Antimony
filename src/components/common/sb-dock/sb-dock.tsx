import React, {useRef, useState} from 'react';

import {Image} from 'primereact/image';
import {Badge} from 'primereact/badge';
import {Button} from 'primereact/button';
import {observer} from 'mobx-react-lite';
import {useNavigate} from 'react-router';
import {OverlayPanel} from 'primereact/overlaypanel';

import {If} from '@sb/types/control';
import NotificationPanel from './notification-panel/notification-panel';
import {useDataBinder, useNotifications} from '@sb/lib/stores/root-store';
import CalendarDialog from '@sb/components/calendar-dialog/calender-dialog';

import './sb-dock.sass';

const SBDock: React.FC = observer(() => {
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  const dataBinder = useDataBinder();
  const navigate = useNavigate();
  const notificationStore = useNotifications();

  const overlayRef = useRef<OverlayPanel>(null);

  return (
    <div className="flex align-items-stretch justify-content-between sb-card sb-dock">
      <div className="flex align-items-center gap-2">
        <div
          className="sb-logo-tab sb-corner-tab"
          onClick={() => navigate('/')}
        >
          <Image src="/assets/icons/favicon-dark.png" width="60px" />
        </div>
        <Button
          icon={
            <span className="material-symbols-outlined">space_dashboard</span>
          }
          className="sb-dock-page-button"
          label="Dashboard"
          outlined
          onClick={() => navigate('/')}
        />
        <Button
          icon={<span className="material-symbols-outlined">border_color</span>}
          className="sb-dock-page-button"
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
        <Button
          outlined
          size="large"
          icon="pi pi-sign-out"
          onClick={() => dataBinder.logout()}
          tooltip="Log Out"
          tooltipOptions={{position: 'bottom'}}
        />
      </div>

      <CalendarDialog
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
      />

      <NotificationPanel ref={overlayRef} />
    </div>
  );
});

export default SBDock;
