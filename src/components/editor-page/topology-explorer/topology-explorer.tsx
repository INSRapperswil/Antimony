import GroupEditDialog from '@sb/components/editor-page/topology-explorer/group-edit-dialog/group-edit-dialog';
import {observer} from 'mobx-react-lite';
import {ContextMenu} from 'primereact/contextmenu';
import {MenuItem} from 'primereact/menuitem';
import React, {MouseEvent, useEffect, useMemo, useRef, useState} from 'react';

import {Tooltip} from 'primereact/tooltip';
import {TreeNode} from 'primereact/treenode';
import {
  Tree,
  TreeEventNodeEvent,
  TreeExpandedKeysType,
  TreeSelectionEvent,
} from 'primereact/tree';

import {Group, Topology} from '@sb/types/types';
import SBConfirm from '@sb/components/common/sb-confirm/sb-confirm';
import {
  useGroupStore,
  useNotifications,
  useTopologyStore,
} from '@sb/lib/stores/root-store';
import ExplorerTreeNode from '@sb/components/editor-page/topology-explorer/explorer-tree-node/explorer-tree-node';

import './topology-explorer.sass';

interface TopologyBrowserProps {
  selectedTopologyId?: string | null;
  onTopologySelect: (id: string) => void;
}

const TopologyExplorer = observer((props: TopologyBrowserProps) => {
  const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isEditGroupOpen, setEditGroupOpen] = useState<boolean>(false);
  const [contextMenuModel, setContextMenuModel] = useState<MenuItem[]>();

  const topologyStore = useTopologyStore();
  const groupStore = useGroupStore();
  const notificationStore = useNotifications();

  const contextMenuRef = useRef<ContextMenu | null>(null);
  const contextMenuTarget = useRef<string | null>(null);

  const topologyTree = useMemo(() => {
    const topologyTree: TreeNode[] = [];
    const topologiesByGroup = new Map<string, Topology[]>();

    for (const topology of topologyStore.topologies) {
      if (topologiesByGroup.has(topology.groupId)) {
        topologiesByGroup.get(topology.groupId)!.push(topology);
      } else {
        topologiesByGroup.set(topology.groupId, [topology]);
      }
    }

    for (const group of groupStore.groups) {
      topologyTree.push({
        key: group.id,
        label: group.name,
        icon: 'pi pi-users',
        selectable: false,
        leaf: false,
        children: topologiesByGroup.get(group.id)?.map(topology => ({
          key: topology.id,
          label: topology.definition.getIn(['name']) as string,
          icon: 'pi pi-file',
          leaf: true,
          selectable: true,
        })),
      });
    }

    return topologyTree;
  }, [groupStore.groups, topologyStore.topologies]);

  useEffect(() => {
    setExpandedKeys(
      Object.fromEntries(topologyTree.map(group => [group.key, true]))
    );
  }, [topologyTree]);

  function onSelectionChange(e: TreeSelectionEvent) {
    if (e.value === null) return;

    props.onTopologySelect(e.value as string);
  }

  function onRenameGroup(id: string, value: string) {
    if (!groupStore.lookup.has(id)) return;

    const targetGroup = groupStore.lookup.get(id)!;
    const updatedGroup = {
      name: value,
      canRun: targetGroup.canRun,
      canWrite: targetGroup.canWrite,
    };
    groupStore.update(id, updatedGroup).then(error => {
      if (error) {
        notificationStore.error(error.message, 'Failed to rename group');
      } else {
        notificationStore.success('Group has been renamed successfully.');
      }
    });
  }

  function onDeleteGroup(id: string) {
    groupStore.delete(id).then(error => {
      if (error) {
        notificationStore.error(error.message, 'Failed to delete group');
      } else {
        notificationStore.success('Group has been deleted.');
      }
    });
  }

  function onAddGroup() {
    setEditingGroup(null);
    setEditGroupOpen(true);
  }

  function onEditGroup(id: string) {
    if (!groupStore.lookup.has(id)) return;

    setEditingGroup(groupStore.lookup.get(id)!);
    setEditGroupOpen(true);
  }

  function onDeleteGroupRequest(id: string) {
    if (!groupStore.lookup.has(id)) return;

    notificationStore.confirm({
      message: 'This action cannot be undone!',
      header: `Delete Group "${groupStore.lookup.get(id)!.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      onAccept: () => onDeleteGroup(id),
    });
  }

  function onDeleteTopologyRequest(id: string) {
    if (!topologyStore.lookup.has(id)) return;

    notificationStore.confirm({
      message: 'This action cannot be undone!',
      header: `Delete Topology "${topologyStore.lookup.get(id)!.definition.get('name')}"?`,
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      onAccept: () => {
        notificationStore.success('Topology was successfully deleted!');
      },
    });
  }

  function onContextMenu(e: MouseEvent<HTMLDivElement>) {
    setContextMenuModel(containerContextMenu);
    contextMenuRef!.current!.show(e);
  }

  function onContextMenuTree(e: TreeEventNodeEvent) {
    if (e.node.leaf) {
      setContextMenuModel(topologyContextMenu);
    } else {
      setContextMenuModel(groupContextMenu);
    }

    contextMenuTarget.current = e.node.key as string;
    contextMenuRef!.current!.show(e.originalEvent);
  }

  const onEditGroupContext = () => {
    if (!contextMenuTarget.current) return;
    onEditGroup(contextMenuTarget.current ?? undefined);
  };

  const onDeleteGroupContext = () => {
    if (!contextMenuTarget.current) return;
    onDeleteGroupRequest(contextMenuTarget.current);
  };

  const onDeleteTopologyContext = () => {
    if (!contextMenuTarget.current) return;
    onDeleteTopologyRequest(contextMenuTarget.current);
  };

  const containerContextMenu = [
    {
      id: 'create',
      label: 'Add Group',
      icon: 'pi pi-plus',
      command: onAddGroup,
    },
  ];

  const groupContextMenu = [
    {
      id: 'create',
      label: 'Add Group',
      icon: 'pi pi-plus',
      command: onAddGroup,
    },
    {
      id: 'edit',
      label: 'Edit Group',
      icon: 'pi pi-file-edit',
      command: onEditGroupContext,
    },
    {
      id: 'delete',
      label: 'Delete Group',
      icon: 'pi pi-trash',
      command: onDeleteGroupContext,
    },
  ];

  const topologyContextMenu = [
    {
      id: 'create',
      label: 'Deploy Lab',
      icon: 'pi pi-play',
    },
    {
      id: 'create',
      label: 'Add Topology',
      icon: 'pi pi-plus',
    },
    {
      id: 'delete',
      label: 'Delete Topology',
      icon: 'pi pi-trash',
      command: onDeleteTopologyContext,
    },
  ];

  return (
    <div className="w-full h-full" onContextMenu={onContextMenu}>
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
        nodeTemplate={node => (
          <ExplorerTreeNode
            node={node}
            onEditGroup={onEditGroup}
            onDeleteGroup={onDeleteGroupRequest}
            onRenameGroup={value => onRenameGroup(node.key as string, value)}
            onRenameTopology={value => onRenameGroup(node.key as string, value)}
            onAddTopology={() => {}}
            onDeployTopology={() => {}}
            onDeleteTopology={onDeleteTopologyRequest}
          />
        )}
        onContextMenu={e => onContextMenuTree(e)}
        onSelectionChange={onSelectionChange}
        onToggle={e => setExpandedKeys(e.value)}
      />
      <GroupEditDialog
        key={editingGroup?.id}
        editingGroup={editingGroup}
        isOpen={isEditGroupOpen}
        onClose={() => setEditGroupOpen(false)}
      />
      <SBConfirm />
      <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
    </div>
  );
});

export default TopologyExplorer;
