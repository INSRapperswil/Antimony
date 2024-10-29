import {
  SBConfirmOpenProps,
  SBConfirmRef,
} from '@sb/components/common/SBConfirm';
import {Toast} from 'primereact/toast';
import React from 'react';

export class NotificationController {
  private toastRef: React.RefObject<Toast>;
  private confirmRef: React.RefObject<SBConfirmRef>;

  constructor(
    toastRef: React.RefObject<Toast>,
    confirmRef: React.RefObject<SBConfirmRef>
  ) {
    this.toastRef = toastRef;
    this.confirmRef = confirmRef;
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

  private send(
    message: string,
    title: string,
    severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast'
  ): void {
    if (!this.toastRef.current) return;
    this.toastRef.current.show({
      summary: title,
      detail: message,
      severity: severity,
    });
  }
}
