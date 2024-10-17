import React from 'react';
import {Toast} from 'primereact/toast';

export class NotificationController {
  private toastRef: React.RefObject<Toast> | null = null;

  constructor(toastRef: React.RefObject<Toast>) {
    this.toastRef = toastRef;
  }

  public success = (message: string, title: string = 'Success') =>
    this.send(message, title, 'success');
  public info = (message: string, title: string = 'Info') =>
    this.send(message, title, 'info');
  public error = (message: string, title: string = 'Error') =>
    this.send(message, title, 'error');
  public warning = (message: string, title: string = 'Warning') =>
    this.send(message, title, 'warn');

  private send(
    message: string,
    title: string,
    severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast'
  ): void {
    if (this.toastRef?.current) {
      this.toastRef.current.show({
        summary: title,
        detail: message,
        severity: severity,
      });
    }
  }
}
