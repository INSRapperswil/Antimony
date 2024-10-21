import React, {useMemo} from 'react';

import {NodeEditor} from '@sb/lib/NodeEditor';
import NodePropertyTableRow from './NodePropertyTableRow';

import './NodePropertyTable.sass';

interface NodePropertyTableProps {
  nodeEditor: NodeEditor;
}

const NodePropertyTable: React.FC<NodePropertyTableProps> = (
  props: NodePropertyTableProps
) => {
  const propertyTable = useMemo(
    () =>
      props.nodeEditor
        .getProperties()
        .map(property => (
          <NodePropertyTableRow
            key={property.index}
            propertyKey={property.key}
            propertyValue={property.value}
            propertyType={property.type}
            propertyIsList={Array.isArray(property.value)}
            wasEdited={props.nodeEditor.wasPropertyEdited(
              property.key,
              property.value,
              property.type
            )}
            onUpdateValue={newValue =>
              props.nodeEditor.onPropertyValueUpdate(
                property.key,
                newValue,
                property.type
              )
            }
            onUpdateKey={newKey =>
              props.nodeEditor.onPropertyKeyUpdate(property.key, newKey)
            }
            onUpdateType={newType =>
              props.nodeEditor.onPropertyTypeUpdate(
                property.key,
                property.value,
                newType
              )
            }
            onUpdateIsList={toList =>
              props.nodeEditor.onPropertyIsListUpdate(
                property.key,
                property.value,
                toList
              )
            }
          />
        )),
    [props.nodeEditor]
  );

  return (
    <table className="sb-node-property-table">
      <thead>
        <tr>
          <td>Property</td>
          <td>Value</td>
          <td>Type</td>
          <td>As List</td>
        </tr>
      </thead>
      <tbody>{propertyTable}</tbody>
    </table>
  );
};

export default NodePropertyTable;
