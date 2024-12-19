import React, {forwardRef, useMemo, useState} from 'react';

import classNames from 'classnames';
import {Chip} from 'primereact/chip';
import {Badge} from 'primereact/badge';
import {observer} from 'mobx-react-lite';
import {Button} from 'primereact/button';
import {ListBox} from 'primereact/listbox';
import {OverlayPanel} from 'primereact/overlaypanel';

import {If} from '@sb/types/control';
import {useNotifications} from '@sb/lib/stores/root-store';
import {ToggleSet} from '@sb/lib/utils/toggle-set';
import {Notification, Severity, SeverityMapping} from '@sb/types/types';

import './notification-panel.sass';

const NotificationPanel = observer(
  forwardRef<OverlayPanel>((_, overlayRef) => {
    const notificationStore = useNotifications();

    const [severityFilter, setSeverityFilter] = useState<ToggleSet<Severity>>(
      new ToggleSet()
    );

    const notificationTemplate = (message: Notification) => {
      return (
        <div
          className="sb-dock-notification-item-container"
          onMouseEnter={() => {
            notificationStore.maskAsRead(message.id);
          }}
        >
          <div
            className={classNames(
              'sb-dock-notification-item',
              SeverityMapping[message.severity]
            )}
          >
            <i className={severityIconMapping[message.severity]}></i>
            <div className="sb-dock-notification-date">
              <span>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span>
                {message.timestamp.toLocaleDateString([], {
                  month: 'numeric',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
            <If condition={!message.isRead}>
              <Badge severity="danger"></Badge>
            </If>
            <div className="sb-dock-notification-text">
              <div className="sb-dock-notification-summary">
                {message.summary}
              </div>
              <div className="sb-dock-notification-detail">
                {message.detail}
              </div>
            </div>
          </div>
        </div>
      );
    };

    const filteredNotificationList = useMemo(() => {
      if (severityFilter.size < 1) return notificationStore.data.toReversed();

      return notificationStore.data
        .filter(msg => severityFilter.has(msg.severity))
        .toReversed();
    }, [notificationStore.data, severityFilter]);

    const NotificationFilterChip = ({severity}: {severity: Severity}) => {
      const label = notificationStore.countBySeverity.has(severity)
        ? String(notificationStore.countBySeverity.get(severity))
        : '0';

      return (
        <Chip
          label={label}
          icon={severityIconMapping[severity]}
          className={classNames(SeverityMapping[severity], {
            selected: severityFilter.has(severity),
          })}
          onClick={() =>
            setSeverityFilter(new ToggleSet(severityFilter.toggle(severity)))
          }
        />
      );
    };

    return (
      <OverlayPanel ref={overlayRef} className="sb-dock-notifications">
        <div className="sb-dock-notifications-header">
          <div className="sb-dock-notifications-left">
            <span>Filter by</span>
            <NotificationFilterChip severity={Severity.Error} />
            <NotificationFilterChip severity={Severity.Warning} />
            <NotificationFilterChip severity={Severity.Success} />
            <NotificationFilterChip severity={Severity.Info} />
          </div>
          <Button
            text
            rounded
            icon="pi pi-eye"
            tooltip="Mark all as read"
            onClick={() => notificationStore.markAllAsRead()}
            aria-label="Mark all as read"
          />
        </div>
        <ListBox
          options={filteredNotificationList}
          optionLabel="name"
          itemTemplate={notificationTemplate}
          emptyMessage="No notifications found"
        />
      </OverlayPanel>
    );
  })
);

const severityIconMapping = {
  0: 'pi pi-times-circle',
  1: 'pi pi-exclamation-triangle',
  2: 'pi pi-check-circle',
  3: 'pi pi-info-circle',
};

export default NotificationPanel;
