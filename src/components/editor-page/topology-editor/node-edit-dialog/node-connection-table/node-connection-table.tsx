import {useDeviceStore, useTopologyStore} from '@sb/lib/stores/root-store';
import {NodeConnection} from '@sb/types/types';
import {Image} from 'primereact/image';
import {InputNumber, InputNumberChangeEvent} from 'primereact/inputnumber';
import React from 'react';

import {NodeEditor} from '@sb/lib/node-editor';

import './node-connection-table.sass';

interface NodeConnectionTableProps {
  nodeEditor: NodeEditor;
}

const NodeConnectionTable = (props: NodeConnectionTableProps) => {
  const topologyStore = useTopologyStore();
  const deviceStore = useDeviceStore();

  function onHostChange(
    connection: NodeConnection,
    event: InputNumberChangeEvent
  ) {
    if (!event.value) return;

    props.nodeEditor.modifyConnection({
      ...connection,
      hostInterfaceIndex: event.value,
    });
  }

  function onTargetChange(
    connection: NodeConnection,
    event: InputNumberChangeEvent
  ) {
    if (!event.value) return;

    props.nodeEditor.modifyConnection({
      ...connection,
      targetInterfaceIndex: event.value,
    });
  }

  return (
    <div className="node-connection-table">
      {topologyStore.manager.topology?.connectionMap
        .get(props.nodeEditor.getNodeName())!
        .map(connection => (
          <div className="node-connection-table-entry" key={connection.index}>
            <Image
              src={deviceStore.getNodeIcon(props.nodeEditor.getNode().kind)}
              width="45px"
            />
            <span className="node-connection-table-entry-text">
              {connection.hostInterface}
            </span>
            <InputNumber
              value={connection.hostInterfaceIndex}
              min={connection.hostInterfaceConfig.interfaceStart}
              max={99}
              onChange={e => onHostChange(connection, e)}
              showButtons
            />

            <span className="node-connection-table-entry-text">
              {connection.targetInterface}
            </span>
            <InputNumber
              value={connection.targetInterfaceIndex}
              min={connection.targetInterfaceConfig.interfaceStart}
              max={99}
              onChange={e => onTargetChange(connection, e)}
              showButtons
            />

            <Image
              src={deviceStore.getNodeIcon(
                props.nodeEditor.getTopology().toJS().topology.nodes[
                  connection.targetNode
                ].kind
              )}
              width="45px"
            />
          </div>
        ))}
    </div>
  );
};

export default NodeConnectionTable;
