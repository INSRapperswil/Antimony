import React from 'react';

import NodeEnvironmentTableRow from './NodeEnvironmentTableRow';

import './NodeEnvironmentTable.sass';
import {NodeEditor} from '@sb/lib/NodeEditor';

interface NodeEnvironmentTableProps {
  nodeEditor: NodeEditor;
}

const NodeEnvironmentTable: React.FC<NodeEnvironmentTableProps> = (
  props: NodeEnvironmentTableProps
) => {
  function generateTable() {
    return props.nodeEditor
      .getProperties()
      .map(property => (
        <NodeEnvironmentTableRow
          key={property.index}
          propertyKey={property.key}
          propertyValue={property.value}
          wasEdited={props.nodeEditor.wasPropertyEdited(
            property.key,
            property.value,
            property.type
          )}
          onUpdateValue={newValue =>
            props.nodeEditor.onEnvironmentValueUpdate(property.key, newValue)
          }
          onUpdateKey={newKey =>
            props.nodeEditor.onEnvironmentKeyUpdate(property.key, newKey)
          }
        />
      ));
  }

  return (
    <table className="sb-node-property-table">
      <thead>
        <tr>
          <td>Key</td>
          <td>Value</td>
        </tr>
      </thead>
      <tbody>{generateTable()}</tbody>
    </table>
  );
};

export default NodeEnvironmentTable;
