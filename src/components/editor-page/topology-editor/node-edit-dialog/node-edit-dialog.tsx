import {useNotifications} from '@sb/lib/notification-controller';
import {
  useDeviceStore,
  useSchemaStore,
  useTopologyStore,
} from '@sb/lib/stores/root-store';
import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {Dropdown} from 'primereact/dropdown';
import {Accordion, AccordionTab} from 'primereact/accordion';

import {If} from '@sb/types/control';
import {NodeEditor} from '@sb/lib/node-editor';
import SBInput from '@sb/components/common/sb-input/sb-input';
import {TopologyDefinition, YAMLDocument} from '@sb/types/types';
import NodePropertyTable from '@sb/components/editor-page/topology-editor/node-edit-dialog/node-property-table/node-property-table';

import './node-edit-dialog.sass';
import SBDialog from '@sb/components/common/sb-dialog/sb-dialog';

interface NodeEditDialogProps {
  editingTopology: YAMLDocument<TopologyDefinition> | null;
  editingNode: string | null;
  isOpen: boolean;

  onClose: () => void;
}

const NodeEditDialog: React.FC<NodeEditDialogProps> = (
  props: NodeEditDialogProps
) => {
  const [nodeKind, setNodeKind] = useState('');

  const topologyStore = useTopologyStore();
  const schemaStore = useSchemaStore();
  const deviceStore = useDeviceStore();
  const notificationController = useNotifications();

  const nodeEditor = useMemo(() => {
    if (
      !props.editingNode ||
      !props.editingTopology ||
      !schemaStore.clabSchema
    ) {
      return null;
    }

    return new NodeEditor(
      schemaStore.clabSchema,
      props.editingNode,
      props.editingTopology,
      notificationController
    );
  }, [
    schemaStore.clabSchema,
    props.editingNode,
    props.editingTopology,
    notificationController,
  ]);

  const kindList = useMemo(() => {
    if (!schemaStore.clabSchema) return;

    return schemaStore.clabSchema['definitions']['node-config']['properties'][
      'kind'
    ]['enum']!.map(kind => ({value: kind}));
  }, [schemaStore]);

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

    topologyStore.manager.apply(nodeEditor.getTopology());
    props.onClose();
  }

  return (
    <SBDialog
      onClose={onClose}
      isOpen={props.isOpen}
      headerIcon={
        nodeEditor ? deviceStore.getNodeIcon(nodeEditor.getNode()) : undefined
      }
      headerTitle="Edit Node"
      className="sb-node-edit-dialog"
    >
      <If condition={nodeEditor !== null}>
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
              addText="Add Variable"
              nodeEditor={nodeEditor!}
              objectKey="env"
              schemaKey="node-config.env"
            />
          </AccordionTab>
          <AccordionTab header="Certificates">
            <NodePropertyTable
              isKeyEditable={true}
              nodeEditor={nodeEditor!}
              objectKey="certificate"
              schemaKey="certificate-config"
            />
          </AccordionTab>
          <AccordionTab header="Healthcheck">
            <NodePropertyTable
              isKeyEditable={true}
              nodeEditor={nodeEditor!}
              objectKey="healthcheck"
              schemaKey="healthcheck-config"
            />
          </AccordionTab>
          <AccordionTab header="DNS Configuration">
            <NodePropertyTable
              isKeyEditable={true}
              nodeEditor={nodeEditor!}
              objectKey="dns"
              schemaKey="dns-config"
            />
          </AccordionTab>
          <AccordionTab header="Extras">
            <NodePropertyTable
              isKeyEditable={true}
              nodeEditor={nodeEditor!}
              objectKey="extras"
              schemaKey="extras-config"
            />
          </AccordionTab>
          <AccordionTab header="Labels">
            <NodePropertyTable
              keyHeader="Label"
              valueHeader="Value"
              addText="Add Label"
              hideType={true}
              isKeyEditable={true}
              nodeEditor={nodeEditor!}
              objectKey="labels"
              schemaKey="node-config.labels"
            />
          </AccordionTab>
        </Accordion>
      </If>
    </SBDialog>
  );
};

export default NodeEditDialog;
