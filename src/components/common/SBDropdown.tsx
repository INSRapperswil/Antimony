import {Dropdown, DropdownChangeEvent} from 'primereact/dropdown';
import {SelectItem} from 'primereact/selectitem';
import React from 'react';

import {If} from '@sb/types/control';
import classNames from 'classnames';

import './SBDropdown.sass';

interface SBDropdownProps {
  id?: string;
  label?: string;
  isHidden?: boolean;
  wasEdited?: boolean;
  hasFilter?: boolean;

  value: string;
  options: SelectItem[];
  optionLabel: string;
  placeholder?: string;

  onValueSubmit: (value: string) => void;
}

const SBDropdown = (props: SBDropdownProps) => {
  function onValueSubmit(event: DropdownChangeEvent) {
    props.onValueSubmit(event.value);
  }

  return (
    <div className="flex flex-column gap-2">
      <If condition={props.id && props.label}>
        <label htmlFor={props.id}>{props.label}</label>
      </If>
      <Dropdown
        disabled={false}
        value={props.value}
        optionLabel={props.optionLabel}
        placeholder={props.placeholder}
        options={props.options}
        filter={props.hasFilter}
        onChange={onValueSubmit}
        className={classNames('sb-dropdown', {
          'sb-dropdown-edited': props.wasEdited,
        })}
      />
    </div>
  );
};

export default SBDropdown;
