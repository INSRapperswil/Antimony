import React, {useEffect, useState} from 'react';
import cloneDeep from 'lodash.clonedeep';
import {validate} from 'jsonschema';

import {Dialog} from 'primereact/dialog';

import {ClabSchema, DeviceInfo, TopologyDefinition} from '@sb/types/Types';

import './NodeEditDialog.sass';
import {NotificationController} from '@sb/lib/NotificationController';
import NodePropertyTable, {
  FieldType,
} from '@sb/components/AdminPage/TopologyEditor/NodeEditDialog/NodePropertyTable/NodePropertyTable';
import SBInput from '@sb/components/common/SBInput';
import {Dropdown} from 'primereact/dropdown';
import {SelectItem} from 'primereact/selectitem';

interface NodeEditDialogProps {
  notificationController: NotificationController;

  openTopology: TopologyDefinition | null;
  editingNode: string | null;
  clabSchema: ClabSchema | null;
  deviceLookup: Map<string, DeviceInfo>;

  onClose: () => void;
  onDone: (updatedTopology: TopologyDefinition) => void;
}

const NodeEditDialog: React.FC<NodeEditDialogProps> = (
  props: NodeEditDialogProps
) => {
  const [editingTopology, setEditingTopology] =
    useState<TopologyDefinition | null>(null);
  const [isOpen, setOpen] = useState(false);

  const [editingNode, setEditingNode] = useState<string | null>(null);

  const [hasValidationError, setValidationError] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [kindError, setKindError] = useState<string | null>(null);

  const [kindList, setKindList] = useState<SelectItem[]>([]);

  useEffect(() => {
    setOpen(props.editingNode !== null && props.openTopology !== null);
    setEditingTopology(cloneDeep(props.openTopology));
    setEditingNode(props.editingNode);
  }, [props.editingNode, props.openTopology]);

  useEffect(() => {
    if (!props.clabSchema) return;

    console.log('schema:', props.clabSchema);

    setKindList(
      props.clabSchema['definitions']['node-config']['properties']['kind'][
        'enum'
      ].map(kind => ({value: kind}))
    );
  }, [props.clabSchema]);

  function onKeyUpdate(
    key: string,
    newKey: string,
    value: string
  ): string | null {
    if (!editingTopology || !editingNode) {
      return null;
    }

    if (key === newKey) {
      return null;
    }

    if (newKey in editingTopology.topology.nodes[editingNode]) {
      setValidationError(true);
      props.notificationController.error('Duplicate key', 'YAML Syntax Error');
      return 'Duplicate key';
    }

    const updatedTopology: TopologyDefinition = cloneDeep(editingTopology);

    // @ts-expect-error We don't need to know the type here as we just remove the property
    delete updatedTopology.topology.nodes[editingNode][key];

    updatedTopology.topology.nodes[editingNode] = Object.assign(
      updatedTopology.topology.nodes[editingNode],
      {[newKey]: value}
    );

    return validateAndSetTopology(updatedTopology);
  }

  function onTypeUpdate(
    key: string,
    value: string,
    type: FieldType
  ): string | null {
    if (!editingTopology || !editingNode) {
      return null;
    }

    const updatedTopology: TopologyDefinition = cloneDeep(editingTopology);

    switch (type) {
      case 'string':
        updatedTopology.topology.nodes[editingNode] = Object.assign(
          updatedTopology.topology.nodes[editingNode],
          {[key]: value}
        );
        break;
      case 'number':
        updatedTopology.topology.nodes[editingNode] = Object.assign(
          updatedTopology.topology.nodes[editingNode],
          {[key]: Number(value)}
        );
        break;
      case 'boolean':
        updatedTopology.topology.nodes[editingNode] = Object.assign(
          updatedTopology.topology.nodes[editingNode],
          {[key]: Boolean(value)}
        );
        break;
    }

    return validateAndSetTopology(
      updatedTopology,
      `Schema does not allow '${type}' here.`
    );
  }

  function onIsListUpdate(
    key: string,
    value: string | string[],
    toList: boolean
  ): string | null {
    if (!editingTopology || !editingNode) {
      return null;
    }

    const updatedTopology: TopologyDefinition = cloneDeep(editingTopology);

    if (toList) {
      updatedTopology.topology.nodes[editingNode] = Object.assign(
        updatedTopology.topology.nodes[editingNode],
        {[key]: [(value as string).split('\n')]}
      );
    } else {
      updatedTopology.topology.nodes[editingNode] = Object.assign(
        updatedTopology.topology.nodes[editingNode],
        {[key]: (value as string[]).join('\n')}
      );
    }

    return validateAndSetTopology(
      updatedTopology,
      toList
        ? 'Schema does not allow list value.'
        : 'Schema does not allow single value.'
    );
  }

  function onValueUpdate(
    key: string,
    value: string | string[],
    type: FieldType
  ): string | null {
    if (!editingTopology || !editingNode) {
      return null;
    }

    const isList = Array.isArray(value);
    const updatedTopology: TopologyDefinition = cloneDeep(editingTopology);

    switch (type) {
      case 'boolean':
        updatedTopology.topology.nodes[editingNode] = Object.assign(
          updatedTopology.topology.nodes[editingNode],
          isList ? {[key]: [Boolean(value)]} : {[key]: Boolean(value)}
        );
        break;
      case 'string':
        updatedTopology.topology.nodes[editingNode] = Object.assign(
          updatedTopology.topology.nodes[editingNode],
          isList ? {[key]: [value]} : {[key]: value}
        );
        break;
      case 'number':
        updatedTopology.topology.nodes[editingNode] = Object.assign(
          updatedTopology.topology.nodes[editingNode],
          isList ? {[key]: [Number(value)]} : {[key]: Number(value)}
        );
        break;
    }

    return validateAndSetTopology(updatedTopology);
  }

  function onNameUpdate(value: string) {
    if (!editingTopology || !editingNode) {
      return null;
    }

    if (value === editingNode) {
      setValidationError(false);
      setNameError(null);
      return null;
    }

    if (value in editingTopology.topology.nodes) {
      setValidationError(true);
      props.notificationController.error(
        'Duplicate node name.',
        'Schema Error'
      );
      setNameError('Duplicate node name.');
      return 'Duplicate node name.';
    }

    const node = editingTopology.topology.nodes[editingNode];
    delete editingTopology.topology.nodes[editingNode];

    editingTopology.topology.nodes[value] = node;

    setValidationError(false);
    setNameError(null);
  }

  function validateAndSetTopology(
    topology: TopologyDefinition,
    customErrorMessage: string | null = null
  ): string | null {
    const validation = validate(topology, props.clabSchema);

    if (validation.errors.length < 1) {
      setValidationError(false);
      setEditingTopology(topology);
      return null;
    } else {
      setValidationError(true);
      props.notificationController.error(
        customErrorMessage ?? validation.errors[0].message,
        'YAML Schema Error'
      );
      return validation.errors[0].message;
    }
  }

  function onClose() {
    if (hasValidationError) {
      // TODO(kian): Add confirmation dialog
      props.onClose();
      return;
    }

    props.onDone(editingTopology!);
  }

  return (
    <>
      <Dialog
        showHeader={false}
        visible={isOpen}
        style={{width: '60vw'}}
        dismissableMask={true}
        onHide={onClose}
      >
        <div className="sb-dialog-header">This is header</div>

        <div className="sb-dialog-content w-full">
          <SBInput
            id="sb-node-name"
            label="Name"
            defaultValue={editingNode ?? ''}
            validationError={nameError ?? undefined}
            onEnter={onNameUpdate}
          />
          <div className="flex flex-column gap-2">
            <label htmlFor="sb-node-kind">Kind</label>
            <Dropdown
              id="sb-node-kind"
              value={editingTopology?.topology.nodes[editingNode ?? '']?.kind}
              optionLabel="value"
              options={kindList}
            />
          </div>
          <NodePropertyTable
            editingNode={editingNode}
            editingTopology={editingTopology}
            onKeyUpdate={onKeyUpdate}
            onValueUpdate={onValueUpdate}
            onTypeUpdate={onTypeUpdate}
            onIsListUpdate={onIsListUpdate}
            schema={props.clabSchema}
          />
        </div>
      </Dialog>
    </>
  );
};

export default NodeEditDialog;
