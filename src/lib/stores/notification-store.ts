import {
  SBConfirmOpenProps,
  SBConfirmRef,
} from '@sb/components/common/sb-confirm/sb-confirm';
import {RootStore} from '@sb/lib/stores/root-store';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  Notification,
  NotificationOut,
  Severity,
  SeverityMapping,
} from '@sb/types/types';
import {action, computed, observable, observe} from 'mobx';

import {Toast} from 'primereact/toast';
import React from 'react';

export class NotificationStore {
  private rootStore: RootStore;

  private toastRef: React.RefObject<Toast> | null = null;
  private confirmRef: React.RefObject<SBConfirmRef> | null = null;

  @observable accessor messages: Notification[] = [];
  @observable accessor countBySeverity: Map<Severity, number> = new Map();
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    observe(rootStore._apiConnectorStore, () => this.fetch());

    this.fetch();

    this.rootStore._apiConnectorStore.socket.on('notification', data => {
      this.handleNotification(NotificationStore.parseNotification(data));
    });
  }

  public fetch() {
    this.rootStore._apiConnectorStore
      .get<NotificationOut[]>('/notifications')
      .then(data => this.update(data));
  }

  @computed
  public get lookup(): Map<string, Notification> {
    return new Map(this.messages.map(message => [message.id, message]));
  }

  @computed
  public get unreadMessages(): number {
    return this.messages.filter(msg => !msg.isRead).length;
  }

  @action
  public clear() {
    this.messages = [];
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
    this.messages = [...this.messages];
  }

  @action
  public markAllAsRead() {
    this.messages.forEach(msg => (msg.isRead = true));
    this.messages = [...this.messages];
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
  private update(data: [boolean, NotificationOut[] | ErrorResponse]) {
    if (data[0]) {
      this.messages = (data[1] as NotificationOut[])
        .map(NotificationStore.parseNotification)
        .toSorted((a, b) => a.timestamp.valueOf() - b.timestamp.valueOf());
      this.countBySeverity = new Map(
        Object.entries(
          Object.groupBy(this.messages, message => message.severity)
        ).map(([severity, list]) => [Number(severity), list.length])
      );
      this.fetchReport = {state: FetchState.Done};
    } else {
      this.fetchReport = {
        state: FetchState.Error,
        errorCode: String((data[1] as ErrorResponse).code),
        errorMessage: (data[1] as ErrorResponse).message,
      };
    }
  }

  @action
  private handleNotification(notification: Notification) {
    this.lookup.set(notification.id, notification);
    this.countBySeverity.set(
      notification.severity,
      (this.countBySeverity.get(notification.severity) ?? 0) + 1
    );
    this.messages.push(notification);
    this.messages = [...this.messages];
    this.send(notification.detail, notification.summary, notification.severity);
  }

  public static parseNotification(input: NotificationOut): Notification {
    return {
      ...input,
      timestamp: new Date(input.timestamp),
      isRead: false,
    };
  }
}
