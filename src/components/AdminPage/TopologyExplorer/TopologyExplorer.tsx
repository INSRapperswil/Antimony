import SBConfirm from '@sb/components/common/SBConfirm';
import SBInput from '@sb/components/common/SBInput';
import {NotificationController} from '@sb/lib/NotificationController';
import {Button} from 'primereact/button';
import React, {useCallback, useEffect, useRef, useState} from 'react';

import {
  Tree,
  TreeEventNodeEvent,
  TreeExpandedKeysType,
  TreeSelectionEvent,
} from 'primereact/tree';
import {Tooltip} from 'primereact/tooltip';
import {TreeNode} from 'primereact/treenode';
import {ContextMenu} from 'primereact/contextmenu';
import {ProgressSpinner} from 'primereact/progressspinner';

import {Choose, Otherwise, When} from '@sb/types/control';
import {DeviceInfo, FetchState, Group, Topology} from '@sb/types/Types';

import './TopologyExplorer.sass';

interface TopologyBrowserProps {
  notificationController: NotificationController;

  groups: Group[];
  topologies: Topology[];
  fetchState: FetchState;
  devices: DeviceInfo[];

  selectedTopologyId?: string | null;
  onTopologySelect: (id: string) => void;
}

const TopologyExplorer: React.FC<TopologyBrowserProps> = (
  props: TopologyBrowserProps
) => {
  const groupContextMenuRef = useRef<ContextMenu | null>(null);
  const topologyContextMenuRef = useRef<ContextMenu | null>(null);

  const [topologyTree, setTopologyTree] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});

  function onCreateGroup() {}
  function onEditGroup() {}
  function onDeleteGroup() {}

  function onRunTopology() {}
  function onCreateTopology() {}
  function onRenameTopology() {}
  function onDeleteTopology() {}

  const generateTopologyTree = useCallback(() => {
    const topologyTree: TreeNode[] = [];
    const topologiesByGroup = new Map<string, Topology[]>();

    for (const topology of props.topologies) {
      if (topologiesByGroup.has(topology.groupId)) {
        topologiesByGroup.get(topology.groupId)!.push(topology);
      } else {
        topologiesByGroup.set(topology.groupId, [topology]);
      }
    }

    for (const group of props.groups) {
      topologyTree.push({
        key: group.id,
        label: group.name,
        icon: 'pi pi-users',
        selectable: false,
        leaf: false,
        children: topologiesByGroup.get(group.id)?.map(topology => ({
          key: topology.id,
          label: topology.definition.name,
          icon: 'pi pi-file',
          leaf: true,
          selectable: true,
        })),
      });
    }

    return topologyTree;
  }, [props.groups, props.topologies]);

  useEffect(() => {
    if (props.fetchState !== FetchState.Done) return;

    const topologyTree = generateTopologyTree();
    setTopologyTree(topologyTree);

    setExpandedKeys(
      Object.fromEntries(topologyTree.map(group => [group.key, true]))
    );
  }, [generateTopologyTree, props.fetchState, props.topologies]);

  const groupContextMenu = [
    {
      id: 'create',
      label: 'Add Group',
      icon: 'pi pi-plus',
      command: onCreateGroup,
    },
    {
      id: 'rename',
      label: 'Edit Group',
      icon: 'pi pi-file-edit',
      command: onEditGroup,
    },
    {
      id: 'delete',
      label: 'Delete Group',
      icon: 'pi pi-trash',
      command: onDeleteGroup,
    },
  ];

  const topologyContextMenu = [
    {
      id: 'create',
      label: 'Deploy Lab',
      icon: 'pi pi-play',
      command: onRunTopology,
    },
    {
      id: 'create',
      label: 'Add Topology',
      icon: 'pi pi-plus',
      command: onCreateTopology,
    },
    {
      id: 'rename',
      label: 'Rename Topology',
      icon: 'pi pi-pencil',
      command: onRenameTopology,
    },
    {
      id: 'delete',
      label: 'Delete Topology',
      icon: 'pi pi-trash',
      command: onDeleteTopology,
    },
  ];

  function onContextMenu(e: TreeEventNodeEvent) {
    if (e.node.leaf) {
      topologyContextMenuRef!.current!.show(e.originalEvent);
    } else {
      groupContextMenuRef!.current!.show(e.originalEvent);
    }
  }

  function onSelectionChange(e: TreeSelectionEvent) {
    if (e.value === null) return;

    props.onTopologySelect(e.value as string);
  }

  function onRenameGroup(uuid: string) {
    console.log('Renaming group: ', uuid);
    props.notificationController.success('Successfully renamed group.');

    return null;
  }

  function onDeleteGroupRequest(uuid: string) {
    props.notificationController.confirm({
      message: 'This action cannot be undone!',
      header: 'Delete Group?',
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      onAccept: () => {
        console.log('Deleting Group: ', uuid);
        props.notificationController.success('Group was successfully deleted!');
      },
    });
  }

  function onDeleteTopologyRequest(uuid: string) {
    props.notificationController.confirm({
      message: 'This action cannot be undone!',
      header: 'Delete Topology?',
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      onAccept: () => {
        console.log('Deleting Topology: ', uuid);
        props.notificationController.success(
          'Topology was successfully deleted!'
        );
      },
    });
  }

  const TreeNodeTemplate = (node: TreeNode) => {
    return (
      <div className="flex align-self-stretch w-full align-items-center justify-content-between">
        <Choose>
          <When condition={node.leaf}>
            <span
              className="tree-node p-treenode-label"
              data-pr-position="right"
              data-pr-my="left+10 center"
              data-pr-showdelay={500}
              data-pr-tooltip={node.label}
            >
              {node.label}
            </span>
            <div className="sb-explorer-node-buttons">
              <Button
                icon="pi pi-trash"
                severity="danger"
                rounded
                text
                tooltip="Delete Topology"
                tooltipOptions={{showDelay: 500}}
                onClick={() => onDeleteTopologyRequest(node.key as string)}
              />
              <Button
                icon="pi pi-play"
                severity="success"
                rounded
                text
                tooltip="Deploy Topology"
                tooltipOptions={{showDelay: 500}}
              />
            </div>
          </When>
          <Otherwise>
            <SBInput
              defaultValue={node.label}
              fullyTransparent={true}
              doubleClick={true}
              isHidden={true}
              explicitSubmit={true}
              onValueSubmit={onRenameGroup}
            />
            <div className="sb-explorer-node-buttons">
              <Button
                icon="pi pi-trash"
                severity="danger"
                rounded
                text
                tooltip="Delete Group"
                tooltipOptions={{showDelay: 500}}
                onClick={() => onDeleteGroupRequest(node.key as string)}
              />
              <Button
                icon="pi pi-plus"
                severity="success"
                rounded
                text
                tooltip="Add Topology"
                tooltipOptions={{showDelay: 500}}
              />
            </div>
          </Otherwise>
        </Choose>
      </div>
    );
  };

  return (
    <>
      <Choose>
        <When condition={topologyTree.length > 0}>
          <Tooltip target=".tree-node" />
          <Tree
            filter
            filterMode="lenient"
            filterPlaceholder="Search"
            value={topologyTree}
            className="w-full"
            emptyMessage=" "
            expandedKeys={expandedKeys}
            selectionMode="single"
            selectionKeys={props.selectedTopologyId}
            nodeTemplate={TreeNodeTemplate}
            onSelectionChange={onSelectionChange}
            onContextMenu={e => onContextMenu(e)}
            onToggle={e => setExpandedKeys(e.value)}
          />
          <ContextMenu model={groupContextMenu} ref={groupContextMenuRef} />
          <ContextMenu
            model={topologyContextMenu}
            ref={topologyContextMenuRef}
          />
          <SBConfirm />
        </When>
        <Otherwise>
          <div className="h-full flex align-items-center">
            <ProgressSpinner />
          </div>
        </Otherwise>
      </Choose>
    </>
  );
};

export default TopologyExplorer;
