import React, {useEffect, useRef, useState} from 'react';

import {Button} from 'primereact/button';
import {Splitter, SplitterPanel} from 'primereact/splitter';
import {validate} from 'jsonschema';

import {
  ClabSchema,
  DeviceInfo,
  FetchState,
  Topology,
  TopologyDefinition,
} from '@sb/types/Types';
import {Choose, Otherwise, When} from '@sb/types/control';
import NodeEditor from './NodeEditor/NodeEditor';
import MonacoWrapper, {MonacoWrapperRef} from './MonacoWrapper/MonacoWrapper';

import './TopologyEditor.sass';
import YAML from 'yaml';
import {APIConnector} from '@sb/lib/APIConnector';
import {useResource} from '@sb/lib/Hooks';
import NodeEditDialog from '@sb/components/AdminPage/TopologyEditor/NodeEditDialog/NodeEditDialog';
import {NotificationController} from '@sb/lib/NotificationController';
import _, {clone} from 'lodash';
import cloneDeep from 'lodash.clonedeep';

export enum ValidationState {
  Working,
  Done,
  Error,
}

interface TopologyEditorProps {
  apiConnector: APIConnector;
  notificationController: NotificationController;

  selectedTopology: Topology | null;
  onSaveTopology: (topology: TopologyDefinition) => boolean;

  hasPendingEdits: boolean;
  onEdit: (isEdited: boolean) => void;

  deviceLookup: Map<string, DeviceInfo>;
}

let validationTimeout: number;

const TopologyEditor: React.FC<TopologyEditorProps> = (
  props: TopologyEditorProps
) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>(
    ValidationState.Done
  );

  const [editingTopology, setEditingTopology] =
    useState<TopologyDefinition | null>(null);

  const [currentlyEditedNode, setCurrentlyEditedNode] = useState<string | null>(
    null
  );

  const [clabSchema, schemaFetchState] = useResource<ClabSchema | null>(
    process.env.SB_CLAB_SCHEMA_URL!,
    props.apiConnector,
    null,
    null,
    true
  );

  const monacoWrapperRef = useRef<MonacoWrapperRef | null>(null);

  /*
   * This is called when the selected topology has been changed by the user.
   */
  useEffect(() => {
    if (props.selectedTopology && monacoWrapperRef.current) {
      monacoWrapperRef?.current.openTopology(props.selectedTopology.definition);
      setEditingTopology(cloneDeep(props.selectedTopology.definition));
    }
  }, [props.selectedTopology, monacoWrapperRef]);

  function onSaveTopology() {
    if (!editingTopology) return;

    if (props.onSaveTopology(editingTopology)) {
      // success
    }
  }

  function onContentChange(content: string) {
    setValidationState(ValidationState.Working);

    /*
     * We delay the validation to 'sync' with the delay of the monaco worker validator.
     *
     * This also debounces the validation as this is called on every input.
     */
    window.clearTimeout(validationTimeout);
    validationTimeout = window.setTimeout(() => {
      validateAndSetContent(content);
    }, 400);
  }

  function validateAndSetContent(content: string) {
    try {
      const obj = YAML.parse(content) as TopologyDefinition;

      if (_.isEqual(obj, props.selectedTopology?.definition)) {
        setValidationState(ValidationState.Done);
        props.onEdit(false);
        return;
      }

      if (validate(obj, clabSchema).errors.length === 0) {
        setValidationState(ValidationState.Done);
        props.onEdit(true);
        setEditingTopology(obj);
        return;
      }

      setValidationState(ValidationState.Error);
    } catch (e) {
      setValidationState(ValidationState.Error);
    }
  }

  function onNodeEdit(nodeName: string) {
    setCurrentlyEditedNode(nodeName);
  }

  function onNodeEditDone(updatedDefinition: TopologyDefinition) {
    if (!_.isEqual(updatedDefinition, editingTopology)) {
      setEditingTopology(updatedDefinition);
      props.onEdit(true);
    }

    setCurrentlyEditedNode(null);
  }

  function onNodeDelete(nodeName: string) {
    if (!editingTopology?.topology.nodes[nodeName]) return;

    const updatedTopology = clone(editingTopology);

    delete updatedTopology.topology.nodes[nodeName];

    setEditingTopology(updatedTopology);
    props.onEdit(true);
  }

  function onNodeConnect(nodeName1: string, nodeName2: string) {
    props.onEdit(true);
  }

  function onNodeAdd(kind: string) {
    props.onEdit(true);
  }

  return (
    <>
      <Choose>
        <When
          condition={
            props.selectedTopology !== null &&
            schemaFetchState === FetchState.Done
          }
        >
          <div className="flex flex-column h-full overflow-hidden">
            <div className="flex justify-content-between sb-card sb-topology-editor-topbar">
              <div className="flex gap-2 justify-content-center left-tab">
                <Button
                  outlined
                  icon="pi pi-undo"
                  size="large"
                  tooltip="Undo"
                  onClick={() => monacoWrapperRef.current?.undo()}
                  tooltipOptions={{position: 'bottom', showDelay: 500}}
                />
                <Button
                  outlined
                  icon="pi pi-refresh"
                  size="large"
                  tooltip="Redo"
                  onClick={() => monacoWrapperRef.current?.redo()}
                  tooltipOptions={{position: 'bottom', showDelay: 500}}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  outlined
                  tooltip="Save"
                  size="large"
                  icon="pi pi-save"
                  disabled={
                    validationState !== ValidationState.Done ||
                    !props.hasPendingEdits
                  }
                  onClick={onSaveTopology}
                  tooltipOptions={{position: 'bottom', showDelay: 500}}
                />
                <Button
                  outlined
                  icon="pi pi-trash"
                  size="large"
                  tooltip="Clear"
                  tooltipOptions={{position: 'bottom', showDelay: 500}}
                />
                <Button
                  outlined
                  icon="pi pi-download"
                  size="large"
                  tooltip="Download"
                  tooltipOptions={{position: 'bottom', showDelay: 500}}
                />
              </div>
              <div className="flex gap-2 justify-content-center right-tab">
                <Button
                  outlined
                  icon="pi pi-play"
                  size="large"
                  tooltip="Deploy Topology"
                  tooltipOptions={{position: 'bottom', showDelay: 500}}
                />
                <Button
                  outlined
                  icon="pi pi-window-maximize"
                  size="large"
                  tooltip="Enter Fullscreen"
                  tooltipOptions={{position: 'bottom', showDelay: 500}}
                />
              </div>
            </div>
            <div className="flex-grow-1 min-h-0">
              <Splitter className="h-full">
                <SplitterPanel
                  className="flex align-items-center justify-content-center overflow-hidden"
                  minSize={10}
                  size={30}
                >
                  <MonacoWrapper
                    ref={monacoWrapperRef}
                    openTopology={editingTopology}
                    language="yaml"
                    setContent={onContentChange}
                    setValidationError={setValidationError}
                  />
                </SplitterPanel>
                <SplitterPanel
                  className="flex align-items-center justify-content-center"
                  minSize={10}
                >
                  <NodeEditor
                    openTopology={editingTopology}
                    deviceLookup={props.deviceLookup}
                    onNodeDelete={onNodeDelete}
                    onNodeEdit={onNodeEdit}
                    onNodeConnect={onNodeConnect}
                    onNodeAdd={onNodeAdd}
                    notificationController={props.notificationController}
                  />
                </SplitterPanel>
              </Splitter>
            </div>
            <div className="flex sb-card sb-topology-editor-bottombar">
              <Choose>
                <When condition={validationState === ValidationState.Error}>
                  <i
                    className="pi pi-times"
                    style={{color: 'var(--danger-color)'}}
                  ></i>
                  <span>{validationError}</span>
                </When>
                <When condition={validationState === ValidationState.Working}>
                  <i
                    className="pi pi-spin pi-spinner-dotted"
                    style={{color: 'var(--warning-color)'}}
                  ></i>
                  <span>Validating...</span>
                </When>
                <Otherwise>
                  <i
                    className="pi pi-check"
                    style={{color: 'var(--success-color)'}}
                  ></i>
                  <span>Done.</span>
                </Otherwise>
              </Choose>
            </div>
          </div>
        </When>
        <When condition={schemaFetchState === FetchState.NetworkError}>
          <div className="flex h-full w-full align-items-center justify-content-center">
            <h3 className="text-center">
              Failed to fetch topology schema from GitHub.
            </h3>
          </div>
        </When>
        <Otherwise>
          <div className="flex h-full w-full align-items-center justify-content-center">
            <h3 className="text-center">No topology selected</h3>
          </div>
        </Otherwise>
      </Choose>
      <NodeEditDialog
        openTopology={editingTopology}
        editingNode={currentlyEditedNode}
        onDone={onNodeEditDone}
        onClose={() => setCurrentlyEditedNode(null)}
        clabSchema={clabSchema}
        notificationController={props.notificationController}
        deviceLookup={props.deviceLookup}
      />
    </>
  );
};

export const IconMap = new Map<string, string>([
  ['VM', 'virtualserver'],
  ['Generic', 'generic'],
  ['Router', 'router'],
  ['Switch', 'switch'],
  ['Container', 'computer'],
]);

export default TopologyEditor;
