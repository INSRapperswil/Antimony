import NodeEditor from '@sb/components/editor-page/topology-editor/node-editor/node-editor';
import React, {useCallback, useEffect, useRef, useState} from 'react';

import {validate} from 'jsonschema';
import {Button} from 'primereact/button';
import {Document, parseDocument} from 'yaml';
import {Splitter, SplitterPanel} from 'primereact/splitter';

import {Topology} from '@sb/types/types';
import {Choose, Otherwise, When} from '@sb/types/control';
import {useSchemaStore, useTopologyStore} from '@sb/lib/stores/root-store';
import {TopologyEditReport} from '@sb/lib/topology-manager';
import MonacoWrapper, {
  MonacoWrapperRef,
} from '@sb/components/editor-page/topology-editor/monaco-wrapper/monaco-wrapper';
import NodeEditDialog from '@sb/components/editor-page/topology-editor/node-edit-dialog/node-edit-dialog';

import './topology-editor.sass';

export enum ValidationState {
  Working,
  Done,
  Error,
}

interface TopologyEditorProps {
  isMaximized: boolean;
  setMaximized: (isMinimized: boolean) => void;

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
  const [openTopology, setOpenTopology] = useState<Document | null>(null);
  const [currentlyEditedNode, setCurrentlyEditedNode] = useState<string | null>(
    null
  );

  const schemaStore = useSchemaStore();
  const topologyStore = useTopologyStore();

  const monacoWrapperRef = useRef<MonacoWrapperRef>(null);

  const onTopologyOpen = useCallback((topology: Topology) => {
    monacoWrapperRef?.current?.openTopology(topology.definition);
    setOpenTopology(topology.definition);
  }, []);

  const onTopologyClose = useCallback(() => {
    setOpenTopology(null);
  }, []);

  const onTopologyEdit = useCallback((editReport: TopologyEditReport) => {
    setPendingEdits(editReport.isEdited);
    setOpenTopology(editReport.updatedTopology.definition);
  }, []);

  useEffect(() => {
    topologyStore.manager.onEdit.register(onTopologyEdit);
    topologyStore.manager.onOpen.register(onTopologyOpen);
    topologyStore.manager.onClose.register(onTopologyClose);

    return () => {
      topologyStore.manager.onEdit.unregister(onTopologyEdit);
      topologyStore.manager.onOpen.unregister(onTopologyOpen);
      topologyStore.manager.onClose.unregister(onTopologyClose);
    };
  }, [topologyStore.manager, onTopologyOpen, onTopologyEdit]);

  function onContentChange(content: string) {
    try {
      const obj = parseDocument(content);

      if (
        obj.errors.length === 0 &&
        validate(obj.toJS(), schemaStore.clabSchema).errors.length === 0
      ) {
        setValidationState(ValidationState.Done);
        topologyStore.manager.apply(obj);
      } else {
        // Set this to working until the monaco worker has finished and generated the error
        setValidationState(ValidationState.Working);
      }
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
            <div className="flex justify-content-between sb-topology-editor-topbar">
              <div className="flex gap-2 justify-content-center left-tab">
                <Button
                  outlined
                  icon="pi pi-undo"
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
                  onClick={topologyStore.manager.clear}
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
                  size={40}
                >
                  <MonacoWrapper
                    ref={monacoWrapperRef}
                    validationError={validationError}
                    validationState={validationState}
                    openTopology={openTopology}
                    language="yaml"
                    setContent={onContentChange}
                    setValidationError={onSetValidationError}
                  />
                </SplitterPanel>
                <SplitterPanel
                  className="flex align-items-center justify-content-center"
                  minSize={10}
                >
                  <NodeEditor
                    onAddNode={onAddNode}
                    onEditNode={onNodeEdit}
                    openTopology={openTopology}
                  />
                </SplitterPanel>
              </Splitter>
            </div>
          </div>
        </When>
        <Otherwise>
          <div className="flex h-full w-full align-items-center justify-content-center">
            <span className="text-center">No topology selected</span>
          </div>
        </Otherwise>
      </Choose>
      <NodeEditDialog
        isOpen={isNodeEditDialogOpen}
        editingTopology={openTopology}
        editingNode={currentlyEditedNode}
        onClose={() => setNodeEditDialogOpen(false)}
      />
    </>
  );
};

export default TopologyEditor;
