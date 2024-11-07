import {observer} from 'mobx-react-lite';
import React, {useCallback, useEffect, useState} from 'react';

import {Tooltip} from 'primereact/tooltip';
import {TreeNode} from 'primereact/treenode';
import {Tree, TreeExpandedKeysType, TreeSelectionEvent} from 'primereact/tree';

import {Topology} from '@sb/types/types';
import SbConfirm from '@sb/components/common/sb-confirm/sb-confirm';
import {useGroupStore, useTopologyStore} from '@sb/lib/stores/root-store';
import {useNotifications} from '@sb/lib/notification-controller';
import ExplorerTreeNode from '@sb/components/editor-page/topology-explorer/explorer-tree-node/explorer-tree-node';

import './topology-explorer.sass';

interface TopologyBrowserProps {
  selectedTopologyId?: string | null;
  onTopologySelect: (id: string) => void;
}

const TopologyExplorer = observer((props: TopologyBrowserProps) => {
  const [topologyTree, setTopologyTree] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});

  const topologyStore = useTopologyStore();
  const groupStore = useGroupStore();
  const notificationController = useNotifications();

  const generateTopologyTree = useCallback(() => {
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
    const topologyTree = generateTopologyTree();
    setTopologyTree(topologyTree);

    setExpandedKeys(
      Object.fromEntries(topologyTree.map(group => [group.key, true]))
    );
  }, [generateTopologyTree]);

  function onSelectionChange(e: TreeSelectionEvent) {
    if (e.value === null) return;

    props.onTopologySelect(e.value as string);
  }

  function onRenameGroup(uuid: string, value: string) {
    notificationController.success('Successfully renamed group.');

    return null;
  }

  function onEditGroup(uuid: string) {}

  function onDeleteGroupRequest(uuid: string) {
    notificationController.confirm({
      message: 'This action cannot be undone!',
      header: 'Delete Group?',
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      onAccept: () => {
        console.log('Deleting Group: ', uuid);
        notificationController.success('Group was successfully deleted!');
      },
    });
  }

  function onDeleteTopologyRequest(uuid: string) {
    notificationController.confirm({
      message: 'This action cannot be undone!',
      header: 'Delete Topology?',
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      onAccept: () => {
        console.log('Deleting Topology: ', uuid);
        notificationController.success('Topology was successfully deleted!');
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
            onAddTopology={() => {}}
            onDeployTopology={() => {}}
            onDeleteTopology={onDeleteTopologyRequest}
          />
        )}
        onSelectionChange={onSelectionChange}
        onToggle={e => setExpandedKeys(e.value)}
      />
      <SbConfirm />
    </>
  );
});

export default TopologyExplorer;
