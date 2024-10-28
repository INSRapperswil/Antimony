import React, {useCallback, useEffect, useRef, useState} from 'react';

import {Button} from 'primereact/button';
import {Splitter, SplitterPanel} from 'primereact/splitter';

import {ClabSchema, Topology, TopologyDefinition} from '@sb/types/Types';
import {Choose, If, Otherwise, When} from '@sb/types/control';
import NodeEditor from './NodeEditor/NodeEditor';
import MonacoWrapper, {MonacoWrapperRef} from './MonacoWrapper/MonacoWrapper';

import './TopologyEditor.sass';
import {APIConnector} from '@sb/lib/APIConnector';
import NodeEditDialog from '@sb/components/AdminPage/TopologyEditor/NodeEditDialog/NodeEditDialog';
import {NotificationController} from '@sb/lib/NotificationController';
import {Tooltip} from 'primereact/tooltip';
import YAML from 'yaml';
import {TopologyEditReport, TopologyManager} from '@sb/lib/TopologyManager';
import {validate} from 'jsonschema';
import {DeviceManager} from '@sb/lib/DeviceManager';

export enum ValidationState {
  Working,
  Done,
  Error,
}

interface TopologyEditorProps {
  apiConnector: APIConnector;
  notificationController: NotificationController;

  isMaximized: boolean;
  setMaximized: (isMinimized: boolean) => void;

  clabSchema: ClabSchema | null;

  deviceManager: DeviceManager;
  topologyManager: TopologyManager;

  onSaveTopology: () => void;
}

const TopologyEditor: React.FC<TopologyEditorProps> = (
  props: TopologyEditorProps
) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>(
    ValidationState.Done
  );

  const [hasPendingEdits, setPendingEdits] = useState(false);
  const [isNodeEditDialogOpen, setNodeEditDialogOpen] = useState(false);
  const [openTopology, setOpenTopology] = useState<TopologyDefinition | null>(
    null
  );
  const [currentlyEditedNode, setCurrentlyEditedNode] = useState<string | null>(
    null
  );

  const monacoWrapperRef = useRef<MonacoWrapperRef>(null);

  const onTopologyOpen = useCallback((topology: Topology) => {
    monacoWrapperRef?.current?.openTopology(topology.definition);
    setOpenTopology(topology.definition);
  }, []);

  const onTopologyEdit = useCallback((editReport: TopologyEditReport) => {
    setPendingEdits(editReport.isEdited);
    setOpenTopology(editReport.updatedTopology.definition);
  }, []);

  useEffect(() => {
    props.topologyManager.onEdit.register(onTopologyEdit);
    props.topologyManager.onOpen.register(onTopologyOpen);

    return () => {
      props.topologyManager.onEdit.unregister(onTopologyEdit);
      props.topologyManager.onOpen.unregister(onTopologyOpen);
    };
  }, [props.topologyManager, onTopologyOpen, onTopologyEdit]);

  function onContentChange(content: string) {
    try {
      const obj = YAML.parse(content) as TopologyDefinition;

      if (validate(obj, props.clabSchema).errors.length === 0) {
        setValidationState(ValidationState.Done);
      } else {
        // Set this to working until the monaco worker has finished and generated the error
        setValidationState(ValidationState.Working);
      }

      props.topologyManager.apply(obj);
    } catch (e) {
      setValidationState(ValidationState.Working);
    }
  }

  function onSetValidationError(error: string | null) {
    if (!error) {
      setValidationState(ValidationState.Done);
      return;
    }

    setValidationState(ValidationState.Error);
    setValidationError(error);
  }

  function onNodeEdit(nodeName: string) {
    setNodeEditDialogOpen(true);
    setCurrentlyEditedNode(nodeName);
  }

  function onAddNode() {}

  return (
    <>
      <Choose>
        <When condition={openTopology !== null}>
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
                    validationState !== ValidationState.Done || !hasPendingEdits
                  }
                  onClick={props.onSaveTopology}
                  tooltipOptions={{position: 'bottom', showDelay: 500}}
                />
                <Button
                  outlined
                  icon="pi pi-trash"
                  size="large"
                  tooltip="Clear"
                  onClick={props.topologyManager.clear}
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
                <Choose>
                  <When condition={props.isMaximized}>
                    <Button
                      outlined
                      icon="pi pi-arrow-down-left-and-arrow-up-right-to-center"
                      size="large"
                      tooltip="Fullscreen"
                      onClick={() => props.setMaximized(false)}
                      tooltipOptions={{position: 'bottom', showDelay: 2000}}
                    />
                  </When>
                  <Otherwise>
                    <Button
                      outlined
                      icon="pi pi-arrow-up-right-and-arrow-down-left-from-center"
                      size="large"
                      tooltip="Fullscreen"
                      onClick={() => props.setMaximized(true)}
                      tooltipOptions={{position: 'bottom', showDelay: 2000}}
                    />
                  </Otherwise>
                </Choose>
              </div>
            </div>
            <div className="flex-grow-1 min-h-0">
              <Splitter className="h-full">
                <SplitterPanel
                  className="flex align-items-center justify-content-center overflow-hidden"
                  minSize={10}
                  size={30}
                >
                  <If condition={props.clabSchema}>
                    <MonacoWrapper
                      ref={monacoWrapperRef}
                      openTopology={openTopology}
                      schema={props.clabSchema!}
                      language="yaml"
                      setContent={onContentChange}
                      setValidationError={onSetValidationError}
                    />
                  </If>
                </SplitterPanel>
                <SplitterPanel
                  className="flex align-items-center justify-content-center"
                  minSize={10}
                >
                  <NodeEditor
                    onAddNode={onAddNode}
                    onEditNode={onNodeEdit}
                    openTopology={openTopology}
                    deviceManager={props.deviceManager}
                    topologyManager={props.topologyManager}
                    notificationController={props.notificationController}
                  />
                </SplitterPanel>
              </Splitter>
            </div>
            <div
              className="flex sb-card sb-topology-editor-bottombar sb-toplogy-editor-validation"
              data-pr-tooltip="test"
              data-pr-position="top"
            >
              <Choose>
                <When condition={validationState === ValidationState.Error}>
                  <i
                    className="pi pi-times"
                    style={{color: 'var(--danger-color)'}}
                  ></i>
                  <span
                    // className="sb-toplogy-editor-validation"
                    data-pr-tooltip="test"
                    data-pr-position="top"
                  >
                    {validationError}
                  </span>
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
              <Tooltip target=".sb-toplogy-editor-validation" />
            </div>
          </div>
        </When>
        <Otherwise>
          <div className="flex h-full w-full align-items-center justify-content-center">
            <h3 className="text-center">No topology selected</h3>
          </div>
        </Otherwise>
      </Choose>
      <NodeEditDialog
        isOpen={isNodeEditDialogOpen}
        editingTopology={openTopology}
        editingNode={currentlyEditedNode}
        topologyManager={props.topologyManager}
        onClose={() => setNodeEditDialogOpen(false)}
        clabSchema={props.clabSchema}
        notificationController={props.notificationController}
        deviceManager={props.deviceManager}
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
