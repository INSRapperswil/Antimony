import {
  Notification,
  useNotifications,
} from '@sb/lib/stores/notification-store';
import {useAPIStore} from '@sb/lib/stores/root-store';
import classNames from 'classnames';
import {Chip} from 'primereact/chip';
import {ListBox} from 'primereact/listbox';
import React, {useRef} from 'react';

import {Button} from 'primereact/button';
import {useNavigate} from 'react-router-dom';

import './sb-dock.sass';
import {OverlayPanel} from 'primereact/overlaypanel';

const SBDock: React.FC = () => {
  const navigate = useNavigate();

  const apiStore = useAPIStore();

  const overlayRef = useRef<OverlayPanel>(null);
  const notifications = useNotifications();

  const notificationTemplate = (message: Notification) => {
    return (
      <div className="sb-dock-notification-item-container">
        <div
          className={classNames('sb-dock-notification-item', message.severity)}
        >
          <i className={iconMapping[message.severity]}></i>
          <span className="sb-dock-notification-date">
            {message.timestamp.toLocaleTimeString()}
          </span>
          <div className="sb-dock-notification-text">
            <div className="sb-dock-notification-summary">
              {message.summary}
            </div>
            <div className="sb-dock-notification-detail">{message.detail}</div>
          </div>
        </div>
        <span>{message.source ?? 'main'}</span>
      </div>
    );
  };

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
          tooltip="Notifications"
          tooltipOptions={{position: 'bottom'}}
        />
        <Button
          outlined
          icon="pi pi-calendar"
          size="large"
          tooltip="Lab Schedule"
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

      <OverlayPanel ref={overlayRef} className="sb-dock-notifications">
        <div className="sb-dock-notifications-header">
          <div className="sb-dock-notifications-left">
            <span>Filter by</span>
            <Chip label="2" icon={iconMapping.error} className="error" />
            <Chip label="23" icon={iconMapping.warn} className="warn" />
            <Chip label="0" icon={iconMapping.success} className="success" />
            <Chip label="3" icon={iconMapping.info} className="info" />
          </div>
          <Button text rounded icon="pi pi-trash" />
        </div>
        <ListBox
          options={notifications.messages}
          optionLabel="name"
          itemTemplate={notificationTemplate}
        />
      </OverlayPanel>
    </div>
  );
};

const iconMapping = {
  error: 'pi pi-times-circle',
  warn: 'pi pi-exclamation-triangle',
  info: 'pi pi-info-circle',
  success: 'pi pi-check-circle',
};

export default SBDock;
