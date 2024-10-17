import React, {useEffect, useRef, useState} from 'react';
import {TreeNode} from 'primereact/treenode';
import {
  Tree,
  TreeEventNodeEvent,
  TreeExpandedKeysType,
  TreeSelectionEvent,
} from 'primereact/tree';
import {ContextMenu} from 'primereact/contextmenu';
import {DeviceInfo, FetchState, Group, Topology} from '@sb/types/Types';
import {Choose, Otherwise, When} from '@sb/types/control';
import {ProgressSpinner} from 'primereact/progressspinner';
import {Tooltip} from 'primereact/tooltip';

interface TopologyBrowserProps {
  groups: Group[];
  topologies: Topology[];
  fetchState: FetchState;
  devices: DeviceInfo[];

  selectedTopology: Topology | null;
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

  useEffect(() => {
    if (props.fetchState !== FetchState.Done) return;

    const topologyTree = generateTopologyTree();
    setTopologyTree(topologyTree);

    setExpandedKeys(
      Object.fromEntries(topologyTree.map(group => [group.key, true]))
    );
  }, [props.topologies]);

  function generateTopologyTree() {
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
  }

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

  const TreeNodeTemplate = (node: TreeNode) => (
    <span
      className="tree-node p-treenode-label"
      data-pr-position="right"
      data-pr-my="left+10 center"
      data-pr-showdelay={500}
      data-pr-tooltip={node.label}
    >
      {node.label}
    </span>
  );

  return (
    <>
      <Choose>
        <When condition={topologyTree.length > 0}>
          <ContextMenu model={groupContextMenu} ref={groupContextMenuRef} />
          <ContextMenu
            model={topologyContextMenu}
            ref={topologyContextMenuRef}
          />
          <Tooltip target=".tree-node" />
          <Tree
            value={topologyTree}
            className="w-full"
            emptyMessage=" "
            expandedKeys={expandedKeys}
            selectionMode="single"
            selectionKeys={props.selectedTopology?.id}
            nodeTemplate={TreeNodeTemplate}
            onSelectionChange={onSelectionChange}
            onContextMenu={e => onContextMenu(e)}
            onToggle={e => setExpandedKeys(e.value)}
          />
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
