import MonacoWrapper, {MonacoWrapperRef} from './monaco-wrapper/monaco-wrapper';
import NodeEditDialog from './node-edit-dialog/node-edit-dialog';
import NodeEditor from './node-editor/node-editor';
import {
  SimulationConfig,
  SimulationConfigContext,
} from './node-editor/state/simulation-config';
import {
  useGroupStore,
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

import FileSaver from 'file-saver';

import {Badge} from 'primereact/badge';
import {Button} from 'primereact/button';
import {Splitter, SplitterPanel} from 'primereact/splitter';
import React, {useCallback, useEffect, useRef, useState} from 'react';

import './topology-editor.sass';
import {Image} from 'primereact/image';

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

  const groupStore = useGroupStore();
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
      const definition = TopologyManager.parseTopology(
        content,
        schemaStore.clabSchema
      );

      if (definition !== null) {
        setValidationState(ValidationState.Done);
        topologyStore.manager.apply(definition, TopologyEditSource.TextEditor);
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

  function onEditNode(nodeName: string) {
    setCurrentlyEditedNode(nodeName);
    setNodeEditDialogOpen(true);
  }

  function onAddNode() {
    setCurrentlyEditedNode(null);
    setNodeEditDialogOpen(true);
  }

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

  function onDownloadTopology() {
    if (!openTopology) return;

    const topologyGroup = groupStore.lookup.get(openTopology.groupId)!;
    const blob = new Blob([openTopology.definition.toString()], {
      type: 'text/plain;charset=utf-8',
    });
    FileSaver.saveAs(
      blob,
      `${topologyGroup.name}_${openTopology.definition.get('name')}.yaml`
    );
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
                  onClick={onDownloadTopology}
                  tooltip="Download"
                  tooltipOptions={{position: 'bottom', showDelay: 500}}
                />
              </div>
              <div className="flex gap-2 justify-content-center">
                <Button
                  outlined
                  icon="pi pi-play"
                  size="large"
                  onClick={onDeployTopoplogy}
                  disabled={!!process.env.IS_OFFLINE}
                  tooltip={
                    process.env.IS_OFFLINE
                      ? 'Deploying not available in offline build.'
                      : 'Deploy Topology'
                  }
                  tooltipOptions={{
                    position: 'bottom',
                    showDelay: 500,
                    showOnDisabled: true,
                  }}
                />
                <Choose>
                  <When condition={props.isMaximized}>
                    <Button
                      outlined
                      icon="pi pi-arrow-down-left-and-arrow-up-right-to-center"
                      size="large"
                      onClick={() => props.setMaximized(false)}
                    />
                  </When>
                  <Otherwise>
                    <Button
                      outlined
                      icon="pi pi-arrow-up-right-and-arrow-down-left-from-center"
                      size="large"
                      onClick={() => props.setMaximized(true)}
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
                      onEditNode={onEditNode}
                      openTopology={openTopology!}
                    />
                  </SimulationConfigContext.Provider>
                </SplitterPanel>
              </Splitter>
            </div>
          </div>
        </When>
        <Otherwise>
          <div className="sb-topology-editor-empty">
            <Image src="/assets/icons/among-us.svg" width="350px" />
            <span className="text-center">No topology selected</span>
          </div>
        </Otherwise>
      </Choose>
      <NodeEditDialog
        key={currentlyEditedNode}
        isOpen={isNodeEditDialogOpen}
        editingTopology={openTopology?.definition ?? null}
        editingNode={currentlyEditedNode}
        onClose={() => setNodeEditDialogOpen(false)}
      />
    </>
  );
};

export default TopologyEditor;
