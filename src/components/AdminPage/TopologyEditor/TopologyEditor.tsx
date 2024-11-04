import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {validate} from 'jsonschema';
import {Button} from 'primereact/button';
import {Tooltip} from 'primereact/tooltip';
import {Document, parseDocument} from 'yaml';
import {Splitter, SplitterPanel} from 'primereact/splitter';

import {Topology} from '@sb/types/Types';
import NodeEditor from './NodeEditor/NodeEditor';
import {Choose, Otherwise, When} from '@sb/types/control';
import {RootStoreContext} from '@sb/lib/stores/RootStore';
import {TopologyEditReport} from '@sb/lib/TopologyManager';
import MonacoWrapper, {MonacoWrapperRef} from './MonacoWrapper/MonacoWrapper';
import NodeEditDialog from '@sb/components/AdminPage/TopologyEditor/NodeEditDialog/NodeEditDialog';

import './TopologyEditor.sass';

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

  const topologyStore = useContext(RootStoreContext).topologyStore;
  const schemaStore = useContext(RootStoreContext).schemaStore;

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
    topologyStore.manager.onEdit.register(onTopologyEdit);
    topologyStore.manager.onOpen.register(onTopologyOpen);

    return () => {
      topologyStore.manager.onEdit.unregister(onTopologyEdit);
      topologyStore.manager.onOpen.unregister(onTopologyOpen);
    };
  }, [topologyStore.manager, onTopologyOpen, onTopologyEdit]);

  function onContentChange(content: string) {
    try {
      const obj = parseDocument(content);

      if (validate(obj.toJS(), schemaStore.clabSchema).errors.length === 0) {
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
                  size={30}
                >
                  <MonacoWrapper
                    ref={monacoWrapperRef}
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
                  <span data-pr-tooltip="test" data-pr-position="top">
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
