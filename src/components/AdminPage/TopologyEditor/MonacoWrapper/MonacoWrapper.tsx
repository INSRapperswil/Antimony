import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {editor} from 'monaco-editor';
import * as monaco from 'monaco-editor';
import {Monaco} from '@monaco-editor/react';
import MonacoEditor from 'react-monaco-editor';
import {configureMonacoYaml} from 'monaco-yaml';

import {TopologyDefinition} from '@sb/types/Types';
import {MonacoOptions, AntimonyTheme} from './monaco.conf';

import './MonacoWrapper.sass';
import YAML from 'yaml';

const schemaModelUri = 'inmemory://schema.yaml';
let validationTimeout: number | undefined;

window.MonacoEnvironment = {
  getWorker() {
    return new Worker(new URL('monaco-yaml/yaml.worker', import.meta.url));
  },
};

interface MonacoWrapperProps {
  openTopology: TopologyDefinition | null;

  setContent(content: string): void;
  setValidationError(error: string | null): void;

  language: string;
}

export interface MonacoWrapperRef {
  /*
   * We need to have this imperative function here for the parent to tell the wrapper that a new
   * topology has been opened instead of just changing the content like in regular updates.
   */
  openTopology: (toplogy: TopologyDefinition) => void;
  undo: () => void;
  redo: () => void;
}

const MonacoWrapper = forwardRef<MonacoWrapperRef, MonacoWrapperProps>(
  (props, ref) => {
    const [textModel, setTextModel] = useState<editor.ITextModel | null>(null);
    const [content, setContent] = useState<string>('');

    const monacoRef = useRef<Monaco | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        openTopology: (toplogy: TopologyDefinition) => {
          if (textModel) {
            console.log('  resetting text');
            textModel.setValue(YAML.stringify(toplogy));
          }
        },
        undo: onTriggerUndo,
        redo: onTriggerRedo,
      }),
      [textModel]
    );

    useEffect(() => {
      if (props.openTopology && textModel) {
        setContent(YAML.stringify(props.openTopology));
      }
    }, [props.openTopology, textModel]);

    useEffect(() => {
      window.addEventListener('keydown', onGlobalKeyPress);

      return () => {
        window.removeEventListener('keydown', onGlobalKeyPress);
      };
    }, []);

    function onGlobalKeyPress(event: KeyboardEvent) {
      if (!event.ctrlKey || !monacoRef.current) return;

      switch (event.key) {
        case 'z':
          onTriggerUndo();
          break;
        case 'y':
          onTriggerRedo();
          break;
      }
    }

    function onTriggerUndo() {
      monacoRef.current?.editor.getEditors()[0].trigger('', 'undo', '');
    }

    function onTriggerRedo() {
      monacoRef.current?.editor.getEditors()[0].trigger('', 'redo', '');
    }

    function onEditorMount(_editor: unknown, monaco: Monaco) {
      monacoRef.current = monaco;

      monaco.editor.defineTheme('antimonyTheme', AntimonyTheme);

      const model = monaco.editor.getModel(monaco.Uri.parse(schemaModelUri))!;
      setTextModel(model);

      editor.onDidChangeMarkers(() => {
        window.clearTimeout(validationTimeout);

        const markers = editor.getModelMarkers({});
        if (markers.length > 0) {
          props.setValidationError(markers[0].message);
        }
      });

      configureMonacoYaml(monaco, {
        enableSchemaRequest: true,
        schemas: [
          {
            fileMatch: ['**/*.yaml'],
            uri: process.env.SB_CLAB_SCHEMA_URL!,
          },
        ],
      });
    }

    function onContentChange() {
      props.setContent(textModel!.getValue());
    }

    return (
      <div className="w-full h-full sb-monaco-wrapper">
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
    );
  }
);

export default MonacoWrapper;
