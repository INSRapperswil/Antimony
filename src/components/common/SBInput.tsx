import React, {useState} from 'react';

import {InputText, InputTextProps} from 'primereact/inputtext';

import {If} from '@sb/types/control';
import classNames from 'classnames';

import './SBInput.sass';
import {InputTextareaProps} from 'primereact/inputtextarea';

type InputProps = InputTextProps & InputTextareaProps;

interface SBInputProps extends InputProps {
  id?: string;
  label?: string;
  isHidden?: boolean;

  wasEdited?: boolean;
  defaultValue?: string;
  placeholder?: string;

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
      <InputText
        onClick={onEnterEditing}
        disabled={false}
        defaultValue={props.defaultValue ?? ''}
        className={classNames('sb-input', {
          'sb-input-disabled': !isEditing && props.isHidden,
          'sb-input-error': !!validationError,
          'sb-input-small': props.isHidden,
        })}
        placeholder={props.placeholder}
        readOnly={!isEditing && props.isHidden}
        tooltip={validationError ?? undefined}
        onBlur={e => onValueSubmit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLElement).blur();
        }}
      />
    </div>
  );
};

export default SBInput;
