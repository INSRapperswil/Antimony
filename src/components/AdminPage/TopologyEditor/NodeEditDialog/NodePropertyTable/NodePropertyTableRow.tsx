import {Choose, Otherwise, When} from '@sb/types/control';
import {PropertyDefinition} from '@sb/types/Types';
import {Dropdown} from 'primereact/dropdown';
import React, {useMemo} from 'react';

import SBInput from '@sb/components/common/SBInput';

interface NodePropertyTableRowProps {
  propertyKey: string;
  propertyValue: string;

  propertyDefinition: PropertyDefinition;

  wasEdited: boolean;

  onUpdateValue: (value: string) => string | null;
}

const NodePropertyTableRow: React.FC<NodePropertyTableRowProps> = (
  props: NodePropertyTableRowProps
) => {
  const propertyType = useMemo(() => {
    if (props.propertyDefinition.type) {
      // For now, we only support string arrays
      if (props.propertyDefinition.type === 'array') return 'string';
      return props.propertyDefinition.type;
    }

    const types =
      props.propertyDefinition.anyOf?.map(entry => entry.type) ?? [];
    if ('string' in types) return 'string';
    if ('number' in types) return 'number';
    if ('boolean' in types) return 'boolean';

    return 'string';
  }, [props.propertyDefinition]);

  const allowedValues = useMemo(() => {
    if (propertyType === 'boolean') {
      return [{value: 'true'}, {value: 'false'}];
    }
    if (!props.propertyDefinition.enum) return null;

    return props.propertyDefinition.enum.map(value => ({value}));
  }, [props.propertyDefinition, propertyType]);

  function getDisplayType() {
    if (props.propertyDefinition.enum) {
      return 'enum';
    }
    return (
      propertyType + (props.propertyDefinition.type === 'array' ? '[]' : '')
    );
  }

  return (
    <tr>
      <td>{props.propertyKey}</td>
      <td className="small-padding">
        <Choose>
          <When condition={allowedValues}>
            <Dropdown
              value={props.propertyValue}
              onChange={e => props.onUpdateValue(e.value)}
              options={allowedValues!}
              optionLabel="value"
              placeholder="Value..."
              className="w-full md:w-14rem"
            />
          </When>
          <Otherwise>
            <SBInput
              onValueSubmit={props.onUpdateValue}
              wasEdited={props.wasEdited}
              defaultValue={props.propertyValue}
              isTextArea={props.propertyDefinition.type === 'array'}
              isHidden={true}
              rows={5}
              cols={30}
            />
          </Otherwise>
        </Choose>
      </td>
      <td className="font-italic">{getDisplayType()}</td>
    </tr>
  );
};

export default NodePropertyTableRow;
