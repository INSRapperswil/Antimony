import React, {FocusEvent, KeyboardEvent, useState} from 'react';

import classNames from 'classnames';
import {InputText} from 'primereact/inputtext';
import {KeyFilterType} from 'primereact/keyfilter';

import {If} from '@sb/types/control';

import './sb-input.sass';

interface SBInputProps {
  id?: string;
  label?: string;
  isHidden?: boolean;
  fullyTransparent?: boolean;

  wasEdited?: boolean;
  defaultValue?: string;
  placeholder?: string;
  keyfilter?: KeyFilterType;
  tooltip?: string;

  doubleClick?: boolean;
  explicitSubmit?: boolean;

  validationError?: string;
  onValueSubmit?: (value: string) => string | null | void;
}

const SBInput = (props: SBInputProps) => {
  const [isEditing, setEditing] = useState(false);
  const [content, setContent] = useState(props.defaultValue);
  const [validationError, setValidationError] = useState<string | null>(null);

  function onValueSubmit(value: string) {
    if (!props.onValueSubmit || value === props.defaultValue) {
      setEditing(false);
      return;
    }

    const error = props.onValueSubmit(value);
    if (error) setValidationError(error);

    if (!error) setEditing(false);
  }

  function onBlur(event: FocusEvent<HTMLInputElement>) {
    if (props.explicitSubmit) {
      setEditing(false);
      setContent(props.defaultValue);
      return;
    }

    onValueSubmit(event.target.value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      onValueSubmit((event.target as HTMLInputElement).value);
    }
  }

  function onSingleClick() {
    if (props.doubleClick) return;
    onEnterEditing();
  }

  function onEnterEditing() {
    if (validationError === null) {
      setEditing(true);
    }
  }

  return (
    <div className="flex flex-column gap-2">
      <If condition={props.id && props.label}>
        <label className="sb-input-label" htmlFor={props.id}>
          {props.label}
        </label>
      </If>
      <InputText
        onClick={onSingleClick}
        capture={false}
        onDoubleClick={onEnterEditing}
        onChange={e => setContent(e.target.value)}
        disabled={false}
        value={content}
        className={classNames('sb-input', {
          'sb-input-disabled': !isEditing && props.isHidden,
          'sb-input-error': !!validationError && !!props.validationError,
          'sb-input-hidden': props.isHidden,
        })}
        keyfilter={props.keyfilter}
        placeholder={props.placeholder}
        readOnly={!isEditing && props.isHidden}
        tooltip={
          validationError ?? props.validationError ?? props.tooltip ?? undefined
        }
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

export default SBInput;
