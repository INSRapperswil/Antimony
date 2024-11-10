import {uuid4} from '@sb/types/types';
import React, {MouseEvent} from 'react';

import {Button} from 'primereact/button';
import {TreeNode} from 'primereact/treenode';

import {Choose, Otherwise, When} from '@sb/types/control';

interface ExplorerTreeNodeProps {
  node: TreeNode;

  onEditGroup: (id: uuid4) => void;
  onDeleteGroup: (id: uuid4) => void;

  onAddTopology: (groupId: uuid4) => void;
  onDeployTopology: (id: uuid4) => void;
  onDeleteTopology: (id: uuid4) => void;
}

const ExplorerTreeNode: React.FC<ExplorerTreeNodeProps> = (
  props: ExplorerTreeNodeProps
) => {
  function onAddTopology(event: MouseEvent<HTMLButtonElement>) {
    props.onAddTopology(props.node.key as uuid4);
    event.stopPropagation();
  }

  function onEditGroup(event: MouseEvent<HTMLButtonElement>) {
    props.onEditGroup(props.node.key as uuid4);
    event.stopPropagation();
  }

  function onDeleteGroup(event: MouseEvent<HTMLButtonElement>) {
    props.onDeleteGroup(props.node.key as uuid4);
    event.stopPropagation();
  }

  function onDeployTopology(event: MouseEvent<HTMLButtonElement>) {
    props.onDeployTopology(props.node.key as uuid4);
    event.stopPropagation();
  }

  function onDeleteTopology(event: MouseEvent<HTMLButtonElement>) {
    props.onDeleteTopology(props.node.key as uuid4);
    event.stopPropagation();
  }

  return (
    <div className="flex align-self-stretch w-full align-items-center justify-content-between">
      <Choose>
        <When condition={props.node.leaf}>
          <span
            className="tree-node p-treenode-label"
            data-pr-position="right"
            data-pr-my="left+10 center"
            data-pr-showdelay={500}
            data-pr-tooltip={props.node.label}
          >
            {props.node.label}
          </span>
          <div className="sb-explorer-node-buttons">
            <Button
              icon="pi pi-trash"
              severity="danger"
              rounded
              text
              tooltip="Delete Topology"
              onClick={onDeleteTopology}
              tooltipOptions={{showDelay: 500}}
            />
            <Button
              icon="pi pi-play"
              severity="success"
              rounded
              text
              tooltip="Deploy Topology"
              onClick={onDeployTopology}
              tooltipOptions={{showDelay: 500}}
            />
          </div>
        </When>
        <Otherwise>
          <span
            className="tree-node p-treenode-label"
            data-pr-position="right"
            data-pr-my="left+10 center"
            data-pr-showdelay={500}
            data-pr-tooltip={props.node.label}
          >
            {props.node.label}
          </span>
          <div className="sb-explorer-node-buttons">
            <Button
              icon="pi pi-pen-to-square"
              severity="secondary"
              rounded
              text
              tooltip="Edit Group"
              onClick={onEditGroup}
              tooltipOptions={{showDelay: 500}}
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              rounded
              text
              tooltip="Delete Group"
              onClick={onDeleteGroup}
              tooltipOptions={{showDelay: 500}}
            />
            <Button
              icon="pi pi-plus"
              severity="success"
              rounded
              text
              tooltip="Add Topology"
              onClick={onAddTopology}
              tooltipOptions={{showDelay: 500}}
            />
          </div>
        </Otherwise>
      </Choose>
    </div>
  );
};

export default ExplorerTreeNode;
