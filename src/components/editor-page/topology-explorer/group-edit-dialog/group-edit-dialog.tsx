import SBInput from '@sb/components/common/sb-input/sb-input';
import {useGroupStore, useNotifications} from '@sb/lib/stores/root-store';
import {Group, GroupIn} from '@sb/types/types';
import {isEqual} from 'lodash';
import {Checkbox} from 'primereact/checkbox';
import React, {useState} from 'react';

import SBDialog from '@sb/components/common/sb-dialog/sb-dialog';

import './group-edit-dialog.sass';

interface GroupEditDialogProps {
  // Set to null if the dialog is meant to add a new group
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

  async function onSubmit() {
    if (!props.editingGroup) {
      groupStore.add(updatedGroup).then(error => {
        if (error) {
          notificationStore.error(error.message, 'Failed to rename group');
        } else {
          notificationStore.success('Group has been renamed successfully.');
          props.onClose();
        }
      });
      return;
    }

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
      <div className="flex gap-4 flex-column">
        <SBInput
          onValueSubmit={value =>
            void setUpdatedGroup({
              ...updatedGroup,
              name: value,
            })
          }
          id="group-edit-name"
          defaultValue={updatedGroup.name}
          label="Group Name"
        />
        <div className="flex align-items-center">
          <Checkbox
            inputId="group-edit-canrun"
            onChange={e =>
              setUpdatedGroup({
                ...updatedGroup,
                canRun: e.checked!,
              })
            }
            checked={updatedGroup.canRun}
          />
          <label htmlFor="group-edit-canrun" className="ml-2">
            Can Run
          </label>
        </div>
        <div className="flex align-items-center">
          <Checkbox
            inputId="group-edit-canwrite"
            onChange={e =>
              setUpdatedGroup({
                ...updatedGroup,
                canWrite: e.checked!,
              })
            }
            checked={updatedGroup.canWrite}
          />
          <label htmlFor="group-edit-canwrite" className="ml-2">
            Can Write
          </label>
        </div>
      </div>
    </SBDialog>
  );
};

export default GroupEditDialog;
