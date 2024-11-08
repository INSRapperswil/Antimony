import {action, observable} from 'mobx';
import React, {createContext, createRef, useContext} from 'react';

import {Toast} from 'primereact/toast';

import {
  SBConfirmOpenProps,
  SBConfirmRef,
} from '@sb/components/common/sb-confirm/sb-confirm';

export class NotificationStore {
  private toastRef: React.RefObject<Toast>;
  private confirmRef: React.RefObject<SBConfirmRef>;

  @observable accessor messages: Notification[] = [
    {
      summary: 'test message 1',
      detail: "something happened here, we can't be too sure though",
      severity: 'warn',
      timestamp: new Date(),
      source: 'net',
    },
    {
      summary: 'some error',
      detail: 'something definitely happened here',
      severity: 'error',
      timestamp: new Date(),
      source: 'parse',
    },
    {
      summary: 'success!!!',
      detail: 'yay finally something good',
      severity: 'success',
      timestamp: new Date(),
      source: 'server',
    },
    {
      summary: 'something unimportant',
      detail: 'unbelievable, look at this',
      severity: 'info',
      timestamp: new Date(),
    },
  ];

  constructor(
    toastRef?: React.RefObject<Toast>,
    confirmRef?: React.RefObject<SBConfirmRef>
  ) {
    this.toastRef = toastRef ?? createRef();
    this.confirmRef = confirmRef ?? createRef();
  }

  public success = (message: string, title: string = 'Success') =>
    this.send(message, title, 'success');
  public info = (message: string, title: string = 'Info') =>
    this.send(message, title, 'info');
  public error = (message: string, title: string = 'Error') =>
    this.send(message, title, 'error');
  public warning = (message: string, title: string = 'Warning') =>
    this.send(message, title, 'warn');

  public confirm(props: SBConfirmOpenProps) {
    if (!this.confirmRef.current) return;

    this.confirmRef.current.show(props);
  }

  @action
  public clear() {
    this.messages = [];
  }

  @action
  private send(
    message: string,
    title: string,
    severity: Severity,
    source?: string
  ): void {
    if (!this.toastRef.current) return;
    const msg = {
      summary: title,
      detail: message,
      severity: severity,
    };
    this.toastRef.current.show(msg);
    this.messages.push({
      ...msg,
      timestamp: new Date(),
      source: source,
    });
  }
}

export type Notification = {
  timestamp: Date;
  source?: string;
  summary: string;
  detail: string;
  severity: Severity;
};

export type Severity = 'success' | 'info' | 'warn' | 'error';

export const NotificationControllerContext = createContext(
  new NotificationStore()
);

export const useNotifications = () => useContext(NotificationControllerContext);
