import {Button} from 'primereact/button';
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
            propertyDefinition={
              props.nodeEditor.clabSchema.definitions['node-config'].properties[
                property.key
              ]
            }
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
          />
        )),
    [props.nodeEditor]
  );

  return (
    <>
      <table className="sb-table">
        <thead>
          <tr>
            <td>Property</td>
            <td>Value</td>
            <td className="p-0">Type</td>
          </tr>
        </thead>
        <tbody>{propertyTable}</tbody>
      </table>
      <div className="flex justify-content-center">
        <Button
          label="Add Property"
          icon="pi pi-plus"
          className="sb-table-add-button"
        />
      </div>
    </>
  );
};

export default NodePropertyTable;
