import React, {KeyboardEvent, useState} from 'react';
import {Dropdown, DropdownChangeEvent} from 'primereact/dropdown';
import {Checkbox} from 'primereact/checkbox';
import SBInput from '@sb/components/common/SBInput';

interface NodePropertyTableRowProps {
  propertyKey: string;
  propertyValue: string;
  propertyType: string;
  isList: boolean;

  onUpdateType: (type: 'string' | 'number' | 'boolean') => string | null;
  onUpdateKey: (key: string) => string | null;
  onUpdateValue: (value: string) => string | null;
  onUpdateIsList: (toList: boolean) => string | null;
}

const NodePropertyTableRow: React.FC<NodePropertyTableRowProps> = (
  props: NodePropertyTableRowProps
) => {
  const [isEditingKey, setEditingKey] = useState(false);
  const [isEditingValue, setEditingValue] = useState(false);

  const [keyError, setKeyError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);

  function onInputKeydown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter') {
      (event.target as HTMLElement).blur();
    }
  }

  function onValueSubmit(content: string) {
    console.log('value:', content);
    const validationError = props.onUpdateValue(content);

    setValueError(validationError);
    if (!validationError) {
      setEditingValue(false);
    }
  }

  function onKeySubmit(content: string) {
    const validationError = props.onUpdateKey(content);

    setKeyError(validationError);
    if (!validationError) {
      setEditingKey(false);
    }
  }

  function onTypeSubmit(event: DropdownChangeEvent) {
    props.onUpdateType(event.target.value);
  }

  function onEnterValueEdit() {
    if (valueError === null && keyError === null) {
      setEditingValue(true);
    }
  }

  function onEnterKeyEdit() {
    if (valueError === null && keyError === null) {
      setEditingKey(true);
    }
  }

  return (
    <tr>
      <td>
        <SBInput
          onClick={onEnterKeyEdit}
          onEnter={onKeySubmit}
          disabled={!isEditingKey}
          validationError={keyError}
          defaultValue={props.propertyKey}
          readOnly={!isEditingKey}
        />
      </td>
      <td>
        <SBInput
          onClick={onEnterValueEdit}
          onEnter={onValueSubmit}
          disabled={!isEditingValue}
          validationError={valueError}
          defaultValue={props.propertyValue}
          isTextArea={props.isList}
          rows={5}
          cols={30}
        />
      </td>
      <td>
        <Dropdown
          value={props.propertyType}
          onChange={onTypeSubmit}
          options={PropertyTypes}
          optionLabel="name"
        />
      </td>
      <td className="sb-node-property-checkbox">
        <Checkbox
          checked={props.isList}
          onChange={e => props.onUpdateIsList(e.checked!)}
        />
      </td>
    </tr>
  );
};

const PropertyTypes = [
  {
    name: 'String',
    value: 'string',
  },
  {
    name: 'Number',
    value: 'number',
  },
  {
    name: 'Boolean',
    value: 'boolean',
  },
];

export default NodePropertyTableRow;
