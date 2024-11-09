import React from 'react';

import {Image} from 'primereact/image';
import {Dialog} from 'primereact/dialog';
import {Button} from 'primereact/button';

import {If} from '@sb/types/control';

import './sb-dialog.sass';

interface SBDialogProps {
  isOpen: boolean;
  onClose: () => void;

  headerTitle: string;
  headerIcon?: string;

  children: React.ReactNode;
  className: string;

  onCancel?: () => void;
  onSubmit?: () => void;

  cancelLabel?: string;
  submitLabel?: string;
}

const SBDialog: React.FC<SBDialogProps> = (props: SBDialogProps) => {
  return (
    <Dialog
      resizable={false}
      showHeader={false}
      visible={props.isOpen}
      dismissableMask={true}
      className={props.className}
      onHide={props.onClose}
    >
      <div className="sb-dialog-header">
        <div className="sb-dialog-header-title">
          <If condition={props.headerIcon}>
            <Image src={props.headerIcon} width="45px" />
          </If>
          <span>{props.headerTitle}</span>
        </div>
        <div className="sb-dialog-header-close">
          <Button
            outlined
            icon="pi pi-times"
            size="large"
            onClick={props.onClose}
          />
        </div>
      </div>

      <div className="sb-dialog-content">{props.children}</div>
      <div className="sb-dialog-footer w-full">
        <Button
          icon="pi pi-times"
          label={props.cancelLabel ?? 'Cancel'}
          outlined
          onClick={() => props.onCancel?.call(null)}
          className="w-8rem"
        />
        <Button
          icon="pi pi-check"
          label={props.submitLabel ?? 'Submit'}
          outlined
          onClick={() => props.onSubmit?.call(null)}
          className="w-8rem"
        />
      </div>
    </Dialog>
  );
};

export default SBDialog;
