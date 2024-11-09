import SBInput from '@sb/components/common/sb-input/sb-input';
import {useGroupStore, useNotifications} from '@sb/lib/stores/root-store';
import {If} from '@sb/types/control';
import {Group, GroupIn} from '@sb/types/types';
import {isEqual} from 'lodash';
import {Checkbox} from 'primereact/checkbox';
import React, {useEffect, useRef, useState} from 'react';

import SBDialog from '@sb/components/common/sb-dialog/sb-dialog';

import './group-edit-dialog.sass';

interface GroupEditDialogProps {
  editingGroup: Group | null;

  isOpen: boolean;
  onClose: () => void;
}

const GroupEditDialog = (props: GroupEditDialogProps) => {
  const groupStore = useGroupStore();
  const notificationStore = useNotifications();

  const [updatedGroup, setUpdatedGroup] = useState<GroupIn>({
    name: props.editingGroup?.name ?? '',
    canRun: props.editingGroup?.canRun ?? false,
    canWrite: props.editingGroup?.canWrite ?? false,
  });

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.isOpen) {
      console.log('FOCUSING:', nameInputRef.current);
      nameInputRef.current?.focus();
    }
  }, [props.isOpen]);

  async function onSubmit() {
    if (!props.editingGroup) return;

    if (
      isEqual(updatedGroup, {
        name: props.editingGroup.name,
        canRun: props.editingGroup.canRun,
        canWrite: props.editingGroup.canWrite,
      })
    ) {
      props.onClose();
      return;
    }

    groupStore.update(props.editingGroup.id, updatedGroup).then(error => {
      if (error) {
        notificationStore.error(error.message, 'Failed to rename group');
      } else {
        notificationStore.success('Group has been renamed successfully.');
        props.onClose();
      }
    });
  }

  return (
    <SBDialog
      onClose={props.onClose}
      isOpen={props.isOpen}
      headerTitle={props.editingGroup ? 'Edit Group' : 'Add Group'}
      className="sb-group-edit-dialog"
      submitLabel="Apply"
      onSubmit={onSubmit}
      onCancel={props.onClose}
    >
      <If condition={props.editingGroup}>
        <div className="flex gap-4 flex-column">
          <SBInput
            ref={nameInputRef}
            onValueSubmit={value =>
              void setUpdatedGroup({
                ...props.editingGroup!,
                name: value,
              })
            }
            id="group-edit-name"
            defaultValue={props.editingGroup!.name}
            label="Group Name"
          />
          <div className="flex align-items-center">
            <Checkbox
              id="group-edit-canrun"
              onChange={e =>
                setUpdatedGroup({
                  ...props.editingGroup!,
                  canRun: e.checked!,
                })
              }
              checked={props.editingGroup!.canRun}
            />
            <label htmlFor="group-edit-canrun" className="ml-2">
              Can Run
            </label>
          </div>
          <div className="flex align-items-center">
            <Checkbox
              id="group-edit-canwrite"
              onChange={e =>
                setUpdatedGroup({
                  ...props.editingGroup!,
                  canWrite: e.checked!,
                })
              }
              checked={props.editingGroup!.canWrite}
            />
            <label htmlFor="group-edit-canwrite" className="ml-2">
              Can Write
            </label>
          </div>
        </div>
      </If>
    </SBDialog>
  );
};

export default GroupEditDialog;
