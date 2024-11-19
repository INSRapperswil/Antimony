import {useTopologyStore} from '@sb/lib/stores/root-store';
import {Button} from 'primereact/button';
import {Divider} from 'primereact/divider';
import React from 'react';

import './node-toolbar.sass';

const NodeToolbar = () => {
  const topologyStore = useTopologyStore();

  return (
    <div className="sb-node-editor-toolbar">
      <Button icon="pi pi-plus" text tooltip="Add Node" />
      <Button
        icon="pi pi-arrow-right-arrow-left"
        text
        tooltip="Connect Nodes"
      />
      <Divider />
      <Button
        icon="pi pi-trash"
        text
        onClick={topologyStore.manager.clear}
        tooltip="Clear"
      />
      <Button icon="pi pi-undo" text tooltip="Reset Layout" />
      <Button icon="pi pi-save" text tooltip="Save Layout" />
    </div>
  );
};

export default NodeToolbar;
