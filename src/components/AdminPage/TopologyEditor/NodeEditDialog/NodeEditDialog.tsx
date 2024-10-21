import React, {useMemo, useState} from 'react';

import {Dialog} from 'primereact/dialog';

import {ClabSchema, DeviceInfo, TopologyDefinition} from '@sb/types/Types';

import './NodeEditDialog.sass';
import {NotificationController} from '@sb/lib/NotificationController';
import NodePropertyTable from '@sb/components/AdminPage/TopologyEditor/NodeEditDialog/NodePropertyTable/NodePropertyTable';
import SBInput from '@sb/components/common/SBInput';
import {Dropdown} from 'primereact/dropdown';
import {Button} from 'primereact/button';
import {If} from '@sb/types/control';
import {NodeEditor} from '@sb/lib/NodeEditor';
import {TopologyManager} from '@sb/lib/TopologyManager';

interface NodeEditDialogProps {
  notificationController: NotificationController;

  editingTopology: TopologyDefinition | null;
  editingNode: string | null;
  isOpen: boolean;
  clabSchema: ClabSchema;
  deviceLookup: Map<string, DeviceInfo>;

  topologyManager: TopologyManager;

  onClose: () => void;
}

const NodeEditDialog: React.FC<NodeEditDialogProps> = (
  props: NodeEditDialogProps
) => {
  const nodeEditor = useMemo(() => {
    if (!props.editingNode || !props.editingTopology) return null;

    return new NodeEditor(
      props.clabSchema,
      props.editingNode,
      props.editingTopology,
      props.notificationController
    );
  }, [
    props.clabSchema,
    props.editingNode,
    props.editingTopology,
    props.notificationController,
  ]);

  const [kindError, setKindError] = useState<string | null>(null);

  const kindList = useMemo(() => {
    return props.clabSchema['definitions']['node-config']['properties']['kind'][
      'enum'
    ].map(kind => ({value: kind}));
  }, [props.clabSchema]);

  function onClose() {
    if (!nodeEditor) return;

    props.topologyManager.edit(nodeEditor.getTopology());
    props.onClose();
  }

  return (
    <>
      <Dialog
        showHeader={false}
        visible={props.isOpen}
        style={{width: '70vw'}}
        dismissableMask={true}
        onHide={onClose}
      >
        <If condition={nodeEditor !== null}>
          <div className="sb-dialog-header">
            <div className="sb-dialog-header-title">Edit Node</div>
            <div className="sb-dialog-header-close">
              <Button outlined icon="pi pi-times" size="large" />
            </div>
          </div>

          <div className="sb-dialog-content w-full">
            <div className="flex gap-4">
              <div className="flex flex-column flex-grow-1 gap-4">
                <div className="flex flex-column gap-2">
                  <span className="sb-dialog-heading">General</span>
                  <SBInput
                    id="sb-node-name"
                    label="Name"
                    defaultValue={props.editingNode!}
                    onValueSubmit={nodeEditor!.onNameUpdate}
                  />
                  <div className="flex flex-column gap-2">
                    <label htmlFor="sb-node-kind">Kind</label>
                    <Dropdown
                      id="sb-node-kind"
                      value={
                        nodeEditor!.getTopology().topology.nodes[
                          props.editingNode!
                        ]?.kind
                      }
                      optionLabel="value"
                      options={kindList}
                    />
                  </div>
                </div>
                {/*<div className="flex flex-column">*/}
                {/*  <span className="sb-dialog-heading">*/}
                {/*    Environment Variables*/}
                {/*  </span>*/}
                {/*  /!*<NodeEnvironmentTable nodeEditor={nodeEditor!} />*!/*/}
                {/*</div>*/}
              </div>
              <div className="flex flex-column">
                <span className="sb-dialog-heading">Additional Properties</span>
                <NodePropertyTable nodeEditor={nodeEditor!} />
              </div>
            </div>
          </div>
        </If>
      </Dialog>
    </>
  );
};

export default NodeEditDialog;
