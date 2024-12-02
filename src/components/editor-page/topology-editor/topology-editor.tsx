import MonacoWrapper, {
  MonacoWrapperRef,
} from '@sb/components/editor-page/topology-editor/monaco-wrapper/monaco-wrapper';
import NodeEditDialog from '@sb/components/editor-page/topology-editor/node-edit-dialog/node-edit-dialog';
import NodeEditor from '@sb/components/editor-page/topology-editor/node-editor/node-editor';
import {
  SimulationConfig,
  SimulationConfigContext,
} from '@sb/components/editor-page/topology-editor/node-editor/state/simulation-config';
import {
  useNotifications,
  useSchemaStore,
  useTopologyStore,
} from '@sb/lib/stores/root-store';
import {
  TopologyEditReport,
  TopologyEditSource,
  TopologyManager,
} from '@sb/lib/topology-manager';
import {Choose, If, Otherwise, When} from '@sb/types/control';

import {Topology, uuid4} from '@sb/types/types';

import {Badge} from 'primereact/badge';
import {Button} from 'primereact/button';
import {Splitter, SplitterPanel} from 'primereact/splitter';
import React, {useCallback, useEffect, useRef, useState} from 'react';

import './topology-editor.sass';

export enum ValidationState {
  Working,
  Done,
  Error,
}

interface TopologyEditorProps {
  isMaximized: boolean;
  setMaximized: (isMinimized: boolean) => void;

  onTopologyDeploy: (id: uuid4) => void;
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
  const [openTopology, setOpenTopology] = useState<Topology | null>(null);
  const [currentlyEditedNode, setCurrentlyEditedNode] = useState<string | null>(
    null
  );

  const schemaStore = useSchemaStore();
  const topologyStore = useTopologyStore();
  const notificatioStore = useNotifications();

  const monacoWrapperRef = useRef<MonacoWrapperRef>(null);

  const onTopologyOpen = useCallback((topology: Topology) => {
    setOpenTopology(topology);
  }, []);

  const onTopologyClose = useCallback(() => {
    setOpenTopology(null);
  }, []);

  const onTopologyEdit = useCallback((editReport: TopologyEditReport) => {
    if (editReport.isEdited) {
      document.title = 'Antimony*';
    } else {
      document.title = 'Antimony';
    }
    setPendingEdits(editReport.isEdited);
    setOpenTopology(editReport.updatedTopology);
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
  }, [
    onTopologyOpen,
    onTopologyEdit,
    onTopologyClose,
    topologyStore.manager.onEdit,
    topologyStore.manager.onOpen,
    topologyStore.manager.onClose,
  ]);

  function onContentChange(content: string) {
    if (!schemaStore.clabSchema) return;

    try {
      const [definition, topologyMeta] = TopologyManager.parseTopology(
        content,
        schemaStore.clabSchema
      );

      if (definition !== null && topologyMeta !== null) {
        setValidationState(ValidationState.Done);
        topologyStore.manager.apply(
          definition,
          TopologyEditSource.TextEditor,
          topologyMeta
        );
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

  async function onSaveTopology() {
    if (!hasPendingEdits) return;

    if (validationState !== ValidationState.Done) {
      notificatioStore.warning(
        'Your schema is not valid.',
        'Failed to save topology.'
      );
      return;
    }

    const error = await topologyStore.manager.save();
    if (error) {
      notificatioStore.error(error.message, 'Failed to save topology.');
    } else {
      notificatioStore.success('Topology has been saved!');
    }

    return;
  }

  function onDeployTopoplogy() {
    if (!openTopology) return;
    props.onTopologyDeploy(openTopology.id);
  }

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
                  size="large"
                  icon="pi pi-save"
                  disabled={
                    validationState !== ValidationState.Done || !hasPendingEdits
                  }
                  tooltip="Save"
                  onClick={onSaveTopology}
                  tooltipOptions={{position: 'bottom', showDelay: 500}}
                  pt={{
                    icon: {
                      className: 'p-overlay-badge',
                      children: (
                        <If condition={hasPendingEdits}>
                          <Badge severity="danger" />
                        </If>
                      ),
                    },
                  }}
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
                  onClick={onDeployTopoplogy}
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
                  className="flex align-items-center justify-content-center"
                  minSize={10}
                  size={30}
                >
                  <MonacoWrapper
                    ref={monacoWrapperRef}
                    validationError={validationError}
                    validationState={validationState}
                    language="yaml"
                    setContent={onContentChange}
                    onSaveTopology={onSaveTopology}
                    setValidationError={onSetValidationError}
                  />
                </SplitterPanel>
                <SplitterPanel
                  className="flex align-items-center justify-content-center"
                  minSize={10}
                >
                  <SimulationConfigContext.Provider
                    value={new SimulationConfig()}
                  >
                    <NodeEditor
                      onAddNode={onAddNode}
                      onEditNode={onNodeEdit}
                      openTopology={openTopology!}
                    />
                  </SimulationConfigContext.Provider>
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
        editingTopology={openTopology?.definition ?? null}
        editingNode={currentlyEditedNode}
        onClose={() => setNodeEditDialogOpen(false)}
      />
    </>
  );
};

export default TopologyEditor;
