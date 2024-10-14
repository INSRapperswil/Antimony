import React, {useRef, useState} from 'react';

import {editor} from 'monaco-editor';
import * as monaco from 'monaco-editor';
import {Monaco} from '@monaco-editor/react';
import MonacoEditor from 'react-monaco-editor';
import {configureMonacoYaml} from 'monaco-yaml';

import {DeviceInfo} from '@sb/types/Types';
import {MonacoOptions, AntimonyTheme} from './monaco.conf';

import './MonacoWrapper.sass';

interface CodeEditorProps {
  content?: string | null;
  device: DeviceInfo[];
  setContent(content: string): void;
  setValidationError(error: string | null): void;

  language: string;
}

const schemaModelUri = 'inmemory://schema.yaml';
let validationTimeout: number | undefined;

window.MonacoEnvironment = {
  getWorker() {
    return new Worker(new URL('monaco-yaml/yaml.worker', import.meta.url));
  },
};

const MonacoWrapper: React.FC<CodeEditorProps> = (props: CodeEditorProps) => {
  const [textModel, setTextModel] = useState<editor.ITextModel | null>(null);

  const monacoRef = useRef<Monaco | null>(null);

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
    if (textModel) {
      props.setContent(textModel.getValue());
    }
  }

  return (
    <div className="w-full h-full sb-monaco-wrapper">
      <MonacoEditor
        language="yaml"
        theme="antimonyTheme"
        value={props.content ?? ''}
        options={MonacoOptions}
        onChange={onContentChange}
        editorDidMount={onEditorMount}
        uri={() => monaco.Uri.parse(schemaModelUri)}
      />
    </div>
  );
};

export default MonacoWrapper;
