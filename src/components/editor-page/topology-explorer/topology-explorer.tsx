import GroupEditDialog from '@sb/components/editor-page/topology-explorer/group-edit-dialog/group-edit-dialog';
import {observer} from 'mobx-react-lite';
import React, {useEffect, useMemo, useState} from 'react';

import {Tooltip} from 'primereact/tooltip';
import {TreeNode} from 'primereact/treenode';
import {Tree, TreeExpandedKeysType, TreeSelectionEvent} from 'primereact/tree';

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

  const topologyStore = useTopologyStore();
  const groupStore = useGroupStore();
  const notificationStore = useNotifications();

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

    console.log('REMAKING TOPOTREE:', topologyTree);
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

  function onRenameTopology(id: string, value: string) {
    // if (!topologyStore.lookup.has(id)) return;
    //
    // const targetTopology = topologyStore.lookup.get(id)!;
    // groupStore.update(id, editing).then(error => {
    //   if (error) {
    //     notificationStore.error(error.message, 'Failed to rename group');
    //   } else {
    //     notificationStore.success('Group has been renamed successfully.');
    //   }
    // });
  }

  function onEditGroup(id: string) {
    if (!groupStore.lookup.has(id)) return;

    setEditingGroup(groupStore.lookup.get(id)!);
    setEditGroupOpen(true);
  }

  function onDeleteGroupRequest(uuid: string) {
    notificationStore.confirm({
      message: 'This action cannot be undone!',
      header: 'Delete Group?',
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      onAccept: () => {
        console.log('Deleting Group: ', uuid);
        notificationStore.success('Group was successfully deleted!');
      },
    });
  }

  function onDeleteTopologyRequest(uuid: string) {
    notificationStore.confirm({
      message: 'This action cannot be undone!',
      header: 'Delete Topology?',
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      onAccept: () => {
        console.log('Deleting Topology: ', uuid);
        notificationStore.success('Topology was successfully deleted!');
      },
    });
  }

  return (
    <>
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
            onDeleteGroup={onDeleteGroupRequest}
            onEditGroup={onEditGroup}
            onRenameGroup={value => onRenameGroup(node.key as string, value)}
            onRenameTopology={value => onRenameGroup(node.key as string, value)}
            onAddTopology={() => {}}
            onDeployTopology={() => {}}
            onDeleteTopology={onDeleteTopologyRequest}
          />
        )}
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
    </>
  );
});

export default TopologyExplorer;
