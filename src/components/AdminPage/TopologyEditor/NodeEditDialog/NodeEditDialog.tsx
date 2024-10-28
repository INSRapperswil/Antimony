import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {Image} from 'primereact/image';
import {Dialog} from 'primereact/dialog';
import {Button} from 'primereact/button';
import {Dropdown} from 'primereact/dropdown';
import {Accordion, AccordionTab} from 'primereact/accordion';

import {If} from '@sb/types/control';
import {NodeEditor} from '@sb/lib/NodeEditor';
import {DeviceManager} from '@sb/lib/DeviceManager';
import SBInput from '@sb/components/common/SBInput';
import {TopologyManager} from '@sb/lib/TopologyManager';
import {ClabSchema, TopologyDefinition} from '@sb/types/Types';
import NodePropertyTable from './NodePropertyTable/NodePropertyTable';
import {NotificationController} from '@sb/lib/NotificationController';

import './NodeEditDialog.sass';

interface NodeEditDialogProps {
  notificationController: NotificationController;

  editingTopology: TopologyDefinition | null;
  editingNode: string | null;
  isOpen: boolean;
  clabSchema: ClabSchema | null;

  topologyManager: TopologyManager;
  deviceManager: DeviceManager;

  onClose: () => void;
}

const NodeEditDialog: React.FC<NodeEditDialogProps> = (
  props: NodeEditDialogProps
) => {
  const [nodeKind, setNodeKind] = useState('');

  const nodeEditor = useMemo(() => {
    if (!props.editingNode || !props.editingTopology || !props.clabSchema) {
      return null;
    }

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

  const kindList = useMemo(() => {
    if (!props.clabSchema) return;

    return props.clabSchema['definitions']['node-config']['properties']['kind'][
      'enum'
    ]!.map(kind => ({value: kind}));
  }, [props.clabSchema]);

  const onTopologyUpdate = useCallback(() => {
    if (!nodeEditor || !nodeEditor.getNode()) return;

    setNodeKind(nodeEditor.getNode().kind);
  }, [nodeEditor]);

  useEffect(() => {
    if (!nodeEditor) return;

    nodeEditor.onEdit.register(onTopologyUpdate);
    onTopologyUpdate();

    return () => nodeEditor.onEdit.unregister(onTopologyUpdate);
  }, [nodeEditor, onTopologyUpdate]);

  function onClose() {
    if (!nodeEditor) return;

    props.topologyManager.apply(nodeEditor.getTopology());
    props.onClose();
  }

  return (
    <>
      <Dialog
        showHeader={false}
        visible={props.isOpen}
        dismissableMask={true}
        className="sb-node-edit-dialog"
        onHide={onClose}
      >
        <If condition={nodeEditor !== null}>
          <div className="sb-dialog-header">
            <div className="sb-dialog-header-title">
              <Image
                src={props.deviceManager.getNodeIcon(nodeEditor!.getNode())}
                width="45px"
              />
              <span>Edit Node</span>
            </div>
            <div className="sb-dialog-header-close">
              <Button
                outlined
                icon="pi pi-times"
                size="large"
                onClick={onClose}
              />
            </div>
          </div>

          <div className="sb-dialog-content w-full">
            <div className="flex flex-column gap-2">
              <SBInput
                id="sb-node-name"
                label="Name"
                defaultValue={props.editingNode!}
                onValueSubmit={nodeEditor!.onUpdateName}
              />
              <div className="flex flex-column gap-2">
                <label htmlFor="sb-node-kind">Kind</label>
                <Dropdown
                  id="sb-node-kind"
                  value={nodeKind}
                  optionLabel="value"
                  options={kindList}
                  onChange={event =>
                    nodeEditor!.updatePropertyValue('kind', '', event.value)
                  }
                />
              </div>
            </div>
            <Accordion multiple activeIndex={0}>
              <AccordionTab header="Node Properties">
                <NodePropertyTable
                  hasPropertyList={true}
                  nodeEditor={nodeEditor!}
                  objectKey=""
                  schemaKey="node-config"
                />
              </AccordionTab>
              <AccordionTab header="Environment Variables">
                <NodePropertyTable
                  keyHeader="Key"
                  hideType={true}
                  isKeyEditable={true}
                  hasPropertyList={false}
                  addText="Add Label"
                  nodeEditor={nodeEditor!}
                  objectKey="env"
                  schemaKey="node-config.env"
                />
              </AccordionTab>
              <AccordionTab header="Certificates">
                <NodePropertyTable
                  isKeyEditable={true}
                  hasPropertyList={true}
                  nodeEditor={nodeEditor!}
                  objectKey="certificate"
                  schemaKey="certificate-config"
                />
              </AccordionTab>
              <AccordionTab header="Healthcheck">
                <NodePropertyTable
                  isKeyEditable={true}
                  hasPropertyList={true}
                  nodeEditor={nodeEditor!}
                  objectKey="healthcheck"
                  schemaKey="healthcheck-config"
                />
              </AccordionTab>
              <AccordionTab header="DNS Configuration">
                <NodePropertyTable
                  isKeyEditable={true}
                  hasPropertyList={true}
                  nodeEditor={nodeEditor!}
                  objectKey="dns"
                  schemaKey="dns-config"
                />
              </AccordionTab>
              <AccordionTab header="Extras">
                <NodePropertyTable
                  isKeyEditable={true}
                  hasPropertyList={true}
                  nodeEditor={nodeEditor!}
                  objectKey="extras"
                  schemaKey="extras-config"
                />
              </AccordionTab>
              <AccordionTab header="Labels">
                <NodePropertyTable
                  keyHeader="Label"
                  valueHeader="Value"
                  addText="Add Variable"
                  hideType={true}
                  isKeyEditable={true}
                  hasPropertyList={false}
                  nodeEditor={nodeEditor!}
                  objectKey="labels"
                  schemaKey="node-config.labels"
                />
              </AccordionTab>
            </Accordion>
          </div>
        </If>
      </Dialog>
    </>
  );
};

export default NodeEditDialog;
