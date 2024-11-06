import React from 'react';

import {Image} from 'primereact/image';
import {Dialog} from 'primereact/dialog';
import {Button} from 'primereact/button';

import {If} from '@sb/types/control';

import './SBDialog.sass';

interface SBDialogProps {
  isOpen: boolean;
  onClose: () => void;

  headerTitle: string;
  headerIcon?: string;

  children: React.ReactNode;
  className: string;
}

const SBDialog: React.FC<SBDialogProps> = (props: SBDialogProps) => {
  return (
    <Dialog
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

      <div className="sb-dialog-content w-full">{props.children}</div>
    </Dialog>
  );
};

export default SBDialog;
