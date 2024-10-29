import React, {useState} from 'react';

import classNames from 'classnames';
import {InputText} from 'primereact/inputtext';
import {KeyFilterType} from 'primereact/keyfilter';

import {If} from '@sb/types/control';

import './SBInput.sass';

interface SBInputProps {
  id?: string;
  label?: string;
  isHidden?: boolean;

  wasEdited?: boolean;
  defaultValue?: string;
  placeholder?: string;
  keyfilter?: KeyFilterType;
  tooltip?: string;

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
        keyfilter={props.keyfilter}
        placeholder={props.placeholder}
        readOnly={!isEditing && props.isHidden}
        tooltip={validationError ?? props.tooltip ?? undefined}
        onBlur={e => onValueSubmit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLElement).blur();
        }}
      />
    </div>
  );
};

export default SBInput;
