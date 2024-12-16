import React from 'react';

import {Toast} from 'primereact/toast';
import {action, computed, observable} from 'mobx';

import {
  Notification,
  NotificationOut,
  Severity,
  SeverityMapping,
} from '@sb/types/types';
import {RootStore} from '@sb/lib/stores/root-store';
import {DataStore} from '@sb/lib/stores/data-store';
import {
  SBConfirmOpenProps,
  SBConfirmRef,
} from '@sb/components/common/sb-confirm/sb-confirm';
import {RemoteDataBinder} from '@sb/lib/stores/data-binder/remote-data-binder';

export class NotificationStore extends DataStore<
  Notification,
  void,
  NotificationOut
> {
  private toastRef: React.RefObject<Toast> | null = null;
  private confirmRef: React.RefObject<SBConfirmRef> | null = null;

  @observable accessor countBySeverity: Map<Severity, number> = new Map();

  constructor(rootStore: RootStore) {
    super(rootStore);

    if (!process.env.IS_OFFLINE) {
      (this.rootStore._dataBinder as RemoteDataBinder).socket.on(
        'notification',
        data => {
          this.handleNotification(
            NotificationStore.parseNotification(data, false)
          );
        }
      );
    }
  }

  protected get resourcePath(): string {
    return '/notifications';
  }
  protected handleUpdate(updatedData: NotificationOut[]): void {
    this.data = updatedData
      .map(msg => NotificationStore.parseNotification(msg, true))
      .toSorted((a, b) => a.timestamp.valueOf() - b.timestamp.valueOf());
    this.countBySeverity = new Map(
      Object.entries(
        Object.groupBy(this.data, message => message.severity)
      ).map(([severity, list]) => [Number(severity), list.length])
    );
  }

  @computed
  public get lookup(): Map<string, Notification> {
    return new Map(this.data.map(message => [message.id, message]));
  }

  @computed
  public get unreadMessages(): number {
    return this.data.filter(msg => !msg.isRead).length;
  }

  @action
  public clear() {
    this.data = [];
  }

  public success = (message: string, title: string = 'Success') => {
    this.send(message, title, Severity.Success);
  };

  public info = (message: string, title: string = 'Info') => {
    this.send(message, title, Severity.Info);
  };

  public error = (message: string, title: string = 'Error') => {
    this.send(message, title, Severity.Error);
  };

  public warning = (message: string, title: string = 'Warning') => {
    this.send(message, title, Severity.Warning);
  };

  public confirm(props: SBConfirmOpenProps) {
    if (!this.confirmRef?.current) return;

    this.confirmRef.current.show(props);
  }

  public setToast(toastRef: React.RefObject<Toast>) {
    this.toastRef = toastRef;
  }

  public setConfirm(confirmRef: React.RefObject<SBConfirmRef>) {
    this.confirmRef = confirmRef;
  }

  @action
  public maskAsRead(id: string) {
    if (!this.lookup.has(id)) return;

    this.lookup.get(id)!.isRead = true;
    this.data = [...this.data];
  }

  @action
  public markAllAsRead() {
    this.data.forEach(msg => (msg.isRead = true));
    this.data = [...this.data];
  }

  @action
  private send(message: string, title: string, severity: Severity): void {
    if (!this.toastRef?.current) return;
    const msg = {
      summary: title,
      detail: message,
      severity: SeverityMapping[severity],
    };
    this.toastRef.current.show(msg);
  }

  @action
  private handleNotification(notification: Notification) {
    this.lookup.set(notification.id, notification);
    this.countBySeverity.set(
      notification.severity,
      (this.countBySeverity.get(notification.severity) ?? 0) + 1
    );
    this.data.push(notification);
    this.data = [...this.data];
    this.send(notification.detail, notification.summary, notification.severity);
  }

  public static parseNotification(
    input: NotificationOut,
    isRead: boolean
  ): Notification {
    return {
      ...input,
      timestamp: new Date(input.timestamp),
      isRead,
    };
  }
}
