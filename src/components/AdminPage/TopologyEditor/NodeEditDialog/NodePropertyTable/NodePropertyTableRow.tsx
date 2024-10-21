import React from 'react';

import {Dropdown} from 'primereact/dropdown';
import {Checkbox} from 'primereact/checkbox';

import SBInput from '@sb/components/common/SBInput';
import {FieldType} from '@sb/lib/TopologyManager';

interface NodePropertyTableRowProps {
  propertyKey: string;
  propertyValue: string;
  propertyType: FieldType;
  propertyIsList: boolean;

  wasEdited: boolean;

  onUpdateType: (type: 'string' | 'number' | 'boolean') => string | null;
  onUpdateKey: (key: string) => string | null;
  onUpdateValue: (value: string) => string | null;
  onUpdateIsList: (toList: boolean) => string | null;
}

const NodePropertyTableRow: React.FC<NodePropertyTableRowProps> = (
  props: NodePropertyTableRowProps
) => (
  <tr>
    <td>
      <SBInput
        onValueSubmit={props.onUpdateKey}
        wasEdited={props.wasEdited}
        defaultValue={props.propertyKey}
        isHidden={true}
      />
    </td>
    <td>
      <SBInput
        onValueSubmit={props.onUpdateValue}
        wasEdited={props.wasEdited}
        defaultValue={props.propertyValue}
        isTextArea={props.propertyIsList}
        isHidden={true}
        rows={5}
        cols={30}
      />
    </td>
    <td>
      <Dropdown
        value={props.propertyType}
        onChange={e => props.onUpdateType(e.target.value)}
        options={PropertyTypes}
        optionLabel="name"
      />
    </td>
    <td className="sb-node-property-checkbox">
      <Checkbox
        checked={props.propertyIsList}
        onChange={e => props.onUpdateIsList(e.checked!)}
      />
    </td>
  </tr>
);

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
