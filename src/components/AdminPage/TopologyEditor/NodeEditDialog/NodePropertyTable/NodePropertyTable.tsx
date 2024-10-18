import React from 'react';

import {TopologyDefinition, TopologyNode} from '@sb/types/Types';
import NodePropertyTableRow from './NodePropertyTableRow';

import './NodePropertyTable.sass';
import _ from 'lodash';

interface NodePropertyTableProps {
  editingNode: string | null;
  editingTopology: TopologyDefinition | null;
  originalTopology: TopologyDefinition | null;

  onKeyUpdate: (key: string, newKey: string, value: string) => string | null;
  onValueUpdate: (key: string, value: string, type: FieldType) => string | null;
  onTypeUpdate: (key: string, value: string, type: FieldType) => string | null;
  onIsListUpdate: (
    key: string,
    value: string | string[],
    toList: boolean
  ) => string | null;

  schema: object | null;
}

const NodePropertyTable: React.FC<NodePropertyTableProps> = (
  props: NodePropertyTableProps
) => {
  function generatePropertyTable(topology: TopologyDefinition | null) {
    if (!props.editingNode || !topology || !props.originalTopology)
      return <></>;

    const node = topology.topology.nodes[props.editingNode];
    if (!node) return <></>;

    return Object.entries(topology.topology.nodes[props.editingNode]).map(
      ([key, value], index) => (
        <NodePropertyTableRow
          key={index}
          propertyKey={key}
          propertyValue={value}
          propertyType={typeof value}
          propertyIsList={Array.isArray(value)}
          wasEdited={
            !(
              key in props.originalTopology!.topology.nodes[props.editingNode!]
            ) ||
            !_.isEqual(
              props.originalTopology!.topology.nodes[props.editingNode!][
                key as keyof TopologyNode
              ],
              value
            )
          }
          onUpdateValue={newValue =>
            props.onValueUpdate(key, newValue, typeof value as FieldType)
          }
          onUpdateKey={newKey => props.onKeyUpdate(key, newKey, value)}
          onUpdateType={newType => props.onTypeUpdate(key, value, newType)}
          onUpdateIsList={toList => props.onIsListUpdate(key, value, toList)}
        />
      )
    );
  }

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
      <tbody>
        {props.editingTopology && generatePropertyTable(props.editingTopology)}
      </tbody>
    </table>
  );
};

export type FieldType = 'string' | 'number' | 'boolean';

export default NodePropertyTable;
