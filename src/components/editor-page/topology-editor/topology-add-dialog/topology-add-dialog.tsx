import SBInput from '@sb/components/common/sb-input/sb-input';
import {useNotifications, useTopologyStore} from '@sb/lib/stores/root-store';
import {ErrorResponse, PostResponse} from '@sb/types/types';
import React, {useRef, useState} from 'react';

import SBDialog from '@sb/components/common/sb-dialog/sb-dialog';

import './topology-add-dialog.sass';
import YAML from 'yaml';

interface TopologyAddDialogProps {
  groupId: string | null;

  onClose: () => void;
  onCreated: (topologyId: string) => void;
}

const TopologyAddDialog = (props: TopologyAddDialogProps) => {
  const [topologyName, setTopologyName] = useState<string>('');

  const topologyNameRef = useRef<HTMLInputElement>(null);

  const topologyStore = useTopologyStore();
  const notificationStore = useNotifications();

  function onNameSubmit(name: string, isImplicit: boolean) {
    if (isImplicit) {
      setTopologyName(name);
    } else {
      void onSubmit(name);
    }
  }

  async function onSubmit(name?: string) {
    if (!props.groupId) return;

    const newTopology = {
      groupId: props.groupId,
      definition: YAML.stringify({
        name: name ?? topologyName,
        topology: {nodes: {}},
      }),
    };
    topologyStore.add(newTopology).then(([success, data]) => {
      if (!success) {
        notificationStore.error(
          (data as ErrorResponse).message,
          'Failed to create topology'
        );
      } else {
        notificationStore.success('Topology has been created successfully.');
        props.onCreated((data as PostResponse).id);
        props.onClose();
      }
    });
  }

  return (
    <SBDialog
      onClose={props.onClose}
      isOpen={props.groupId !== null}
      headerTitle={'Create Topology'}
      className="sb-topology-add-dialog"
      submitLabel="Apply"
      onSubmit={onSubmit}
      onCancel={props.onClose}
      onShow={() => topologyNameRef.current?.focus()}
    >
      <SBInput
        ref={topologyNameRef}
        onValueSubmit={onNameSubmit}
        placeholder="e.g. OSPF Lab"
        id="topology-add-name"
        label="Topology Name"
      />
    </SBDialog>
  );
};

export default TopologyAddDialog;
