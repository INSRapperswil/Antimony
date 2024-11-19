import SBDialog from '@sb/components/common/sb-dialog/sb-dialog';
import SBDropdown from '@sb/components/common/sb-dropdown/sb-dropdown';
import SBInput from '@sb/components/common/sb-input/sb-input';
import NodePropertyTable from '@sb/components/editor-page/topology-editor/node-edit-dialog/node-property-table/node-property-table';

import './node-edit-dialog.sass';
import {NodeEditor} from '@sb/lib/node-editor';
import {
  useDeviceStore,
  useNotifications,
  useSchemaStore,
  useTopologyStore,
} from '@sb/lib/stores/root-store';
import {TopologyEditSource} from '@sb/lib/topology-manager';

import {If} from '@sb/types/control';
import {TopologyDefinition, YAMLDocument} from '@sb/types/types';

import {Accordion, AccordionTab} from 'primereact/accordion';
import React, {useCallback, useEffect, useMemo, useState} from 'react';

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
  const notificationStore = useNotifications();

  const kindList = useMemo(() => {
    if (!schemaStore.clabSchema) return [];

    return schemaStore.clabSchema['definitions']['node-config']['properties'][
      'kind'
    ]['enum']!.map(kind => ({value: kind}));
  }, [schemaStore.clabSchema]);

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
      notificationStore
    );
  }, [
    schemaStore.clabSchema,
    props.editingNode,
    props.editingTopology,
    notificationStore,
  ]);

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

  function onCloseRequest() {
    if (!nodeEditor) return;

    if (nodeEditor.hasEdits()) {
      notificationStore.confirm({
        message: 'Discard unsaved changes?',
        header: 'Unsaved Changes',
        icon: 'pi pi-info-circle',
        severity: 'warning',
        onAccept: props.onClose,
      });
    } else {
      props.onClose();
    }
  }

  function onSave() {
    if (nodeEditor) {
      topologyStore.manager.apply(
        nodeEditor.getTopology(),
        TopologyEditSource.NodeEditor
      );
    }

    props.onClose();
  }

  return (
    <SBDialog
      isOpen={props.isOpen}
      headerIcon={
        nodeEditor ? deviceStore.getNodeIcon(nodeEditor.getNode()) : undefined
      }
      headerTitle="Edit Node"
      className="sb-node-edit-dialog"
      submitLabel="Save"
      onSubmit={onSave}
      onClose={onCloseRequest}
      onCancel={onCloseRequest}
    >
      <If condition={nodeEditor !== null}>
        <div className="flex flex-column gap-2">
          <SBInput
            id="sb-node-name"
            label="Name"
            defaultValue={props.editingNode!}
            onValueSubmit={nodeEditor!.onUpdateName}
          />
          <SBDropdown
            id="node-editor-kind"
            label="Kind"
            hasFilter={true}
            value={nodeKind}
            options={kindList}
            icon="pi-cog"
            useItemTemplate={true}
            useSelectTemplate={true}
            optionLabel="value"
            onValueSubmit={value =>
              nodeEditor!.updatePropertyValue('kind', '', value)
            }
          />
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
