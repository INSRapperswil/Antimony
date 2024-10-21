import React, {useState} from 'react';

import {InputText, InputTextProps} from 'primereact/inputtext';

import {Choose, If, Otherwise, When} from '@sb/types/control';
import classNames from 'classnames';

import './SBInput.sass';
import {InputTextarea, InputTextareaProps} from 'primereact/inputtextarea';

type InputProps = InputTextProps & InputTextareaProps;

interface SBInputProps extends InputProps {
  id?: string;
  label?: string;
  isHidden?: boolean;

  wasEdited?: boolean;

  defaultValue?: string;

  isTextArea?: boolean;
  areaRows?: number;
  areaCols?: number;

  onValueSubmit?: (value: string) => string | null;
}

const SBInput = (props: SBInputProps) => {
  const [isEditing, setEditing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  function onValueSubmit(value: string) {
    if (!props.onValueSubmit) return;

    const error = props.onValueSubmit(value);
    setValidationError(error);

    if (!error) {
      setEditing(false);
    }
  }

  function onEnterEditing() {
    if (validationError === null) {
      setEditing(true);
    }
  }

  return (
    <div className="flex flex-column gap-2">
      <If condition={props.id && props.label}>
        <label htmlFor={props.id}>{props.label}</label>
      </If>
      <Choose>
        <When condition={props.isTextArea}>
          <InputTextarea
            {...props}
            onClick={onEnterEditing}
            disabled={false}
            className={classNames({
              'sb-input-disabled': !isEditing && props.isHidden,
              'sb-input-error': !!validationError,
              'sb-input-edited': props.wasEdited,
            })}
            readOnly={!isEditing && props.isHidden}
            tooltip={validationError ?? undefined}
            onBlur={e => onValueSubmit(e.target.value)}
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
            onClick={onEnterEditing}
            disabled={false}
            defaultValue={props.defaultValue ?? ''}
            className={classNames({
              'sb-input-disabled': !isEditing && props.isHidden,
              'sb-input-error': !!validationError,
              'sb-input-edited': props.wasEdited,
            })}
            readOnly={!isEditing && props.isHidden}
            tooltip={validationError ?? undefined}
            onBlur={e => onValueSubmit(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') (e.target as HTMLElement).blur();
            }}
          />
        </Otherwise>
      </Choose>
    </div>
  );
};

export default SBInput;
