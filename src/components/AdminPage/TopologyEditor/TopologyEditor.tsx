import React, {useEffect, useState} from 'react';

import {Button} from 'primereact/button';
import {Splitter, SplitterPanel} from 'primereact/splitter';
import {validate} from 'jsonschema';

import {
  DeviceInfo,
  FetchState,
  Topology,
  TopologyDefinition,
} from '@sb/types/Types';
import {Choose, Otherwise, When} from '@sb/types/control';
import NodeEditor from './NodeEditor/NodeEditor';
import MonacoWrapper from './MonacoWrapper/MonacoWrapper';

import './TopologyEditor.sass';
import YAML from 'yaml';
import {APIConnector} from '@sb/lib/APIConnector';
import {useResource} from '@sb/lib/Hooks';

export enum ValidationState {
  Working,
  Done,
  Error,
}

interface TopologyEditorProps {
  apiConnector: APIConnector;
  selectedTopology: Topology | null;
  devices: DeviceInfo[];
}

let validationTimeout: number | undefined;

const TopologyEditor: React.FC<TopologyEditorProps> = (
  props: TopologyEditorProps
) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>(
    ValidationState.Done
  );
  const [currentTopology, setCurrentTopology] =
    useState<TopologyDefinition | null>(null);

  const [schema, schemaFetchState] = useResource(
    process.env.SB_CLAB_SCHEMA_URL!,
    props.apiConnector,
    {},
    true
  );

  useEffect(() => {
    if (props.selectedTopology) {
      onContentChange(props.selectedTopology.definition, false);
    }
  }, [props.selectedTopology]);

  function onContentChange(content: string, delayed = true) {
    setValidationState(ValidationState.Working);

    /*
     * We delay the validation to 'sync' with the delay of the monaco worker validator.
     *
     * This also debounces the validation as this is called on every input.
     */
    if (delayed) {
      window.clearTimeout(validationTimeout);
      validationTimeout = window.setTimeout(() => {
        validateYaml(content);
      }, 400);
    } else {
      validateYaml(content);
    }
  }

  function validateYaml(content: string) {
    try {
      const obj = YAML.parse(content) as TopologyDefinition;

      if (validate(obj, schema).errors.length === 0) {
        setValidationState(ValidationState.Done);
        setCurrentTopology(obj);
      } else {
        setValidationState(ValidationState.Error);
      }
    } catch (e) {
      setValidationState(ValidationState.Error);
    }
  }

  return (
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
                tooltipOptions={{position: 'bottom', showDelay: 500}}
              />
              <Button
                outlined
                icon="pi pi-refresh"
                size="large"
                tooltip="Redo"
                tooltipOptions={{position: 'bottom', showDelay: 500}}
              />
            </div>
            <div className="flex gap-2">
              <Button
                outlined
                icon="pi pi-save"
                size="large"
                tooltip="Save"
                disabled={validationState !== ValidationState.Done}
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
                  language="yaml"
                  content={props.selectedTopology?.definition}
                  setContent={onContentChange}
                  setValidationError={setValidationError}
                  device={props.devices}
                />
              </SplitterPanel>
              <SplitterPanel
                className="flex align-items-center justify-content-center"
                minSize={10}
              >
                <NodeEditor
                  topology={currentTopology}
                  devices={props.devices}
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
                  style={{color: 'var(--danger-color)'}}
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
        <h3>Failed to fetch topology schema from GitHub.</h3>
      </When>
      <Otherwise>
        <div className="flex h-full w-full align-items-center justify-content-center">
          <h3 className="text-center">No topology selected</h3>
        </div>
      </Otherwise>
    </Choose>
  );
};

export default TopologyEditor;
