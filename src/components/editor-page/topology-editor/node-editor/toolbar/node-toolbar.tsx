import {useTopologyStore} from '@sb/lib/stores/root-store';
import {Button} from 'primereact/button';
import {Divider} from 'primereact/divider';
import React from 'react';

import './node-toolbar.sass';

interface NodeToolbarProps {
  onAutoLayout: () => void;
  onFitLayout: () => void;
}

const NodeToolbar = (props: NodeToolbarProps) => {
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
      <Button
        icon="pi pi-sparkles"
        text
        tooltip="Auto Layout"
        onClick={props.onAutoLayout}
      />
      <Button
        icon="pi pi-save"
        text
        tooltip="Save Layout"
        onClick={topologyStore.manager.writePositions}
      />
      <Button
        icon="pi pi-search-plus"
        text
        tooltip="Fit Layout"
        onClick={props.onFitLayout}
      />
    </div>
  );
};

export default NodeToolbar;
