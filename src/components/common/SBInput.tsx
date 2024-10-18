import React from 'react';

import {InputText, InputTextProps} from 'primereact/inputtext';

import {Choose, If, Otherwise, When} from '@sb/types/control';
import classNames from 'classnames';

import './SBInput.sass';
import {InputTextarea, InputTextareaProps} from 'primereact/inputtextarea';

type InputProps = InputTextProps & InputTextareaProps;

interface SBInputProps extends InputProps {
  id?: string;
  label?: string;
  validationError?: string;
  disabled?: boolean;

  wasEdited?: boolean;

  defaultValue?: string;

  isTextArea?: boolean;
  areaRows?: number;
  areaCols?: number;

  onEnter: (value: string) => void;
}

const SBInput = (props: SBInputProps) => (
  <div className="flex flex-column gap-2">
    <If condition={props.id && props.label}>
      <label htmlFor={props.id}>{props.label}</label>
    </If>
    <Choose>
      <When condition={props.isTextArea}>
        <InputTextarea
          {...props}
          disabled={false}
          className={classNames({
            'sb-input-disabled': props.disabled,
            'sb-input-error': !!props.validationError,
            'sb-input-edited': props.wasEdited,
          })}
          readOnly={props.disabled}
          tooltip={props.validationError}
          onBlur={e => props.onEnter(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLElement).blur();
          }}
          rows={props.areaRows ?? 5}
          cols={props.areaCols ?? 30}
        />
      </When>
      <Otherwise>
        <InputText
          {...props}
          disabled={false}
          defaultValue={props.defaultValue ?? ''}
          className={classNames({
            'sb-input-disabled': props.disabled,
            'sb-input-error': !!props.validationError,
            'sb-input-edited': props.wasEdited,
          })}
          readOnly={props.disabled}
          tooltip={props.validationError}
          onBlur={e => props.onEnter(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLElement).blur();
          }}
        />
      </Otherwise>
    </Choose>
  </div>
);

export default SBInput;
