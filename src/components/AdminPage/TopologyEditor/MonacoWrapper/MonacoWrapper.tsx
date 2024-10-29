import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import {Document} from 'yaml';
import {editor} from 'monaco-editor';
import * as monaco from 'monaco-editor';
import {Monaco} from '@monaco-editor/react';
import MonacoEditor from 'react-monaco-editor';
import {configureMonacoYaml} from 'monaco-yaml';

import {MonacoOptions, AntimonyTheme} from './monaco.conf';
import {ClabSchema} from '@sb/types/Types';

import './MonacoWrapper.sass';

const schemaModelUri = 'inmemory://schema.yaml';

window.MonacoEnvironment = {
  getWorker() {
    return new Worker(new URL('monaco-yaml/yaml.worker', import.meta.url));
  },
};

interface MonacoWrapperProps {
  openTopology: Document | null;
  schema: ClabSchema;

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

const MonacoWrapper = forwardRef<MonacoWrapperRef, MonacoWrapperProps>(
  (props, ref) => {
    const textModelRef = useRef<editor.ITextModel | null>(null);
    const monacoEditorRef = useRef<Monaco | null>(null);

    useImperativeHandle(ref, () => ({
      openTopology: (topology: Document) => {
        if (textModelRef.current) {
          textModelRef.current.setValue(topology.toString());
        }
      },
      undo: onTriggerUndo,
      redo: onTriggerRedo,
    }));

    const onGlobalKeyPress = useCallback((event: KeyboardEvent) => {
      if (!event.ctrlKey) return;

      switch (event.key) {
        case 'z':
          onTriggerUndo();
          break;
        case 'y':
          onTriggerRedo();
          break;
      }
    }, []);

    const content = useMemo(() => {
      if (props.openTopology) {
        return props.openTopology.toString();
      }
      return '';
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
            schema: props.schema,
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
