import {observer} from 'mobx-react-lite';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {toJS} from 'mobx';
import MonacoEditor from 'react-monaco-editor/lib/editor';
import {Document} from 'yaml';
import {editor} from 'monaco-editor';
import {Monaco} from '@monaco-editor/react';
import {configureMonacoYaml} from 'monaco-yaml';

import {Choose, If, Otherwise, When} from '@sb/types/control';
import {useSchemaStore, useTopologyStore} from '@sb/lib/stores/root-store';
import {AntimonyTheme, MonacoOptions} from './monaco.conf';

import './monaco-wrapper.sass';
import {isEqual} from 'lodash';
import {ValidationState} from '@sb/components/editor-page/topology-editor/topology-editor';
import {Tooltip} from 'primereact/tooltip';
import {monaco} from 'react-monaco-editor';

const schemaModelUri = 'inmemory://schema.yaml';

window.MonacoEnvironment = {
  getWorker() {
    return new Worker(new URL('monaco-yaml/yaml.worker', import.meta.url));
  },
};

interface MonacoWrapperProps {
  validationError: string | null;
  validationState: ValidationState;
  openTopology: Document | null;

  onSaveTopology: () => void;
  setContent: (content: string) => void;
  setValidationError: (error: string | null) => void;

  language: string;
}

export interface MonacoWrapperRef {
  /*
   * We need to have this imperative function here for the parent to tell the wrapper that a new
   * topology has been opened instead of just changing the content like in regular updates.
   */
  openTopology: (topology: Document) => void;
  undo: () => void;
  redo: () => void;
}

const MonacoWrapper = observer(
  forwardRef<MonacoWrapperRef, MonacoWrapperProps>((props, ref) => {
    const textModelRef = useRef<editor.ITextModel | null>(null);
    const monacoEditorRef = useRef<Monaco | null>(null);

    const schemaStore = useSchemaStore();
    const topologyStore = useTopologyStore();

    useImperativeHandle(ref, () => ({
      openTopology: (topology: Document) => {
        if (textModelRef.current) {
          textModelRef.current.setValue(topology.toString());
        }
      },
      undo: onTriggerUndo,
      redo: onTriggerRedo,
    }));

    const onGlobalKeyPress = useCallback(
      (event: KeyboardEvent) => {
        if (!event.ctrlKey) return;

        switch (event.key) {
          case 's':
            props.onSaveTopology();
            event.preventDefault();
            break;
          case 'z':
            onTriggerUndo();
            break;
          case 'y':
            onTriggerRedo();
            break;
        }
      },
      [topologyStore.manager]
    );

    const [content, setContent] = useState('');

    useEffect(() => {
      if (!props.openTopology) return;

      const updatedContent = props.openTopology?.toString();
      if (!textModelRef.current) {
        setContent(updatedContent);
        return;
      }

      const existingContent = textModelRef.current.getValue();
      const updatedContentStripped = updatedContent.replaceAll(' ', '');
      const existingContentStripped = existingContent.replaceAll(' ', '');

      if (!isEqual(updatedContentStripped, existingContentStripped)) {
        setContent(updatedContent);
      }
    }, [props.openTopology]);

    useEffect(() => {
      window.addEventListener('keydown', onGlobalKeyPress);

      return () => {
        window.removeEventListener('keydown', onGlobalKeyPress);
      };
    }, [onGlobalKeyPress]);

    function onTriggerUndo() {
      monacoEditorRef.current?.editor.getEditors()[0].trigger('', 'undo', '');
    }

    function onTriggerRedo() {
      monacoEditorRef.current?.editor.getEditors()[0].trigger('', 'redo', '');
    }

    function onEditorMount(_editor: unknown, monaco: Monaco) {
      if (!schemaStore.clabSchema) return;

      monacoEditorRef.current = monaco;
      textModelRef.current = monaco.editor.getModel(
        monaco.Uri.parse(schemaModelUri)
      )!;

      monaco.editor.defineTheme('antimonyTheme', AntimonyTheme);

      editor.onDidChangeMarkers(() => {
        const markers = editor.getModelMarkers({});
        if (markers.length > 0) {
          props.setValidationError(markers[0].message);
        }
      });

      configureMonacoYaml(monaco, {
        enableSchemaRequest: false,
        schemas: [
          {
            fileMatch: ['**/*.yaml'],
            schema: toJS(schemaStore.clabSchema),
            uri: process.env.SB_CLAB_SCHEMA_URL!,
          },
        ],
      });
    }

    function onContentChange() {
      if (textModelRef.current) {
        props.setContent(textModelRef.current.getValue());
      }
    }

    return (
      <If condition={schemaStore.clabSchema}>
        <div className="w-full h-full sb-monaco-wrapper">
          <div
            className="sb-monaco-wrapper-error"
            data-pr-tooltip={props.validationError ?? 'Schema Valid'}
            data-pr-position="right"
          >
            <Choose>
              <When condition={props.validationState === ValidationState.Error}>
                <i
                  className="pi pi-times"
                  style={{color: 'var(--danger-color-text)'}}
                ></i>
              </When>
              <When
                condition={props.validationState === ValidationState.Working}
              >
                <span>Validating...</span>
              </When>
              <Otherwise>
                <i
                  className="pi pi-check"
                  style={{color: 'var(--success-color-text)'}}
                ></i>
              </Otherwise>
            </Choose>
            <Tooltip
              className="sb-monaco-wrapper-error-tooltip"
              target=".sb-monaco-wrapper-error"
            />
            {/*<Button*/}
            {/*  text*/}
            {/*  icon="pi pi-check"*/}
            {/*  size="large"*/}
            {/*  tooltip="Clear"*/}
            {/*  tooltipOptions={{position: 'bottom', showDelay: 500}}*/}
            {/*/>*/}
          </div>
          <MonacoEditor
            language="yaml"
            value={content}
            theme="antimonyTheme"
            options={MonacoOptions}
            onChange={onContentChange}
            editorDidMount={onEditorMount}
            uri={() => monaco.Uri.parse(schemaModelUri)}
          />
        </div>
      </If>
    );
  })
);

export default MonacoWrapper;
