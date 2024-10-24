import React from 'react';

import SBInput from '@sb/components/common/SBInput';

interface NodeEnvironmentTableProps {
  propertyKey: string;
  propertyValue: string;

  wasEdited: boolean;

  onUpdateKey: (key: string) => string | null;
  onUpdateValue: (value: string) => string | null;
}

const NodeEnvironmentTableRow: React.FC<NodeEnvironmentTableProps> = (
  props: NodeEnvironmentTableProps
) => {
  return (
    <tr>
      <td>
        <SBInput
          onValueSubmit={props.onUpdateKey}
          wasEdited={props.wasEdited}
          defaultValue={props.propertyValue}
          isHidden={true}
        />
      </td>
      <td>
        <SBInput
          onValueSubmit={props.onUpdateValue}
          wasEdited={props.wasEdited}
          defaultValue={props.propertyValue}
          isHidden={true}
        />
      </td>
    </tr>
  );
};

export default NodeEnvironmentTableRow;
