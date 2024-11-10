import React from 'react';
import classNames from 'classnames';
import {SelectItem} from 'primereact/selectitem';
import {Dropdown, DropdownChangeEvent} from 'primereact/dropdown';

import {If} from '@sb/types/control';

import './sb-dropdown.sass';

interface SBDropdownProps {
  id?: string;
  label?: string;
  isHidden?: boolean;
  wasEdited?: boolean;
  hasFilter?: boolean;
  showClear?: boolean;

  value: string;
  icon?: string;
  options?: SelectItem[];
  optionLabel?: string;
  placeholder?: string;
  emptyMessage?: string;
  filterPlaceholder?: string;

  useItemTemplate?: boolean;
  useSelectTemplate?: boolean;

  onValueSubmit: (value: string) => void;
}

const SBDropdown = (props: SBDropdownProps) => {
  function onValueSubmit(event: DropdownChangeEvent) {
    props.onValueSubmit(event.value);
  }

  const dropdownTemplate = (option: SelectItem) => {
    return (
      <div className="flex align-items-center gap-2">
        <If condition={props.icon}>
          <i className={`pi ${props.icon}`}></i>
        </If>
        <span>{option.label ?? option.value}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-column gap-2">
      <If condition={props.id && props.label}>
        <label className="sb-dropdown-label" htmlFor={props.id}>
          {props.label}
        </label>
      </If>
      <Dropdown
        disabled={false}
        showClear={false}
        value={props.value}
        optionLabel={props.optionLabel}
        placeholder={props.placeholder}
        options={props.options}
        filter={props.hasFilter}
        resetFilterOnHide={true}
        emptyMessage={props.emptyMessage}
        filterPlaceholder={props.filterPlaceholder ?? 'Search...'}
        onChange={onValueSubmit}
        itemTemplate={props.useItemTemplate ? dropdownTemplate : undefined}
        valueTemplate={props.useSelectTemplate ? dropdownTemplate : undefined}
        className={classNames({
          'sb-dropdown-hidden': props.isHidden,
          'sb-dropdown-edited': props.wasEdited,
        })}
      />
    </div>
  );
};

export default SBDropdown;
