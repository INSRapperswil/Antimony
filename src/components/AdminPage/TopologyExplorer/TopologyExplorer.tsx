import ExplorerTreeNode from '@sb/components/AdminPage/TopologyExplorer/ExplorerTreeNode/ExplorerTreeNode';
import SBConfirm from '@sb/components/common/SBConfirm';
import {NotificationControllerContext} from '@sb/lib/NotificationController';
import {RootStoreContext} from '@sb/lib/stores/RootStore';
import {combinedFetchState} from '@sb/lib/utils/Utils';

import {Choose, Otherwise, When} from '@sb/types/control';
import {FetchState, Topology} from '@sb/types/Types';
import {ProgressSpinner} from 'primereact/progressspinner';
import {Tooltip} from 'primereact/tooltip';

import {Tree, TreeExpandedKeysType, TreeSelectionEvent} from 'primereact/tree';
import {TreeNode} from 'primereact/treenode';
import React, {useCallback, useContext, useEffect, useState} from 'react';

import './TopologyExplorer.sass';

interface TopologyBrowserProps {
  selectedTopologyId?: string | null;
  onTopologySelect: (id: string) => void;
}

const TopologyExplorer: React.FC<TopologyBrowserProps> = (
  props: TopologyBrowserProps
) => {
  const [topologyTree, setTopologyTree] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});

  const topologyStore = useContext(RootStoreContext).topologyStore;
  const groupStore = useContext(RootStoreContext).groupStore;
  const notificationController = useContext(NotificationControllerContext);

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
  }, [groupStore, topologyStore]);

  useEffect(() => {
    if (
      combinedFetchState(topologyStore.fetchState, groupStore.fetchState) !==
      FetchState.Done
    ) {
      return;
    }

    const topologyTree = generateTopologyTree();
    setTopologyTree(topologyTree);

    setExpandedKeys(
      Object.fromEntries(topologyTree.map(group => [group.key, true]))
    );
  }, [groupStore, topologyStore, generateTopologyTree]);

  function onSelectionChange(e: TreeSelectionEvent) {
    if (e.value === null) return;

    props.onTopologySelect(e.value as string);
  }

  function onRenameGroup(uuid: string, value: string) {
    console.log('Renaming group: ', uuid, ' to ', value);
    notificationController.success('Successfully renamed group.');

    return null;
  }

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
            nodeTemplate={node => (
              <ExplorerTreeNode
                node={node}
                onDeleteGroup={onDeleteGroupRequest}
                onRenameGroup={value =>
                  onRenameGroup(node.key as string, value)
                }
                onAddTopology={() => {}}
                onDeployTopology={() => {}}
                onDeleteTopology={onDeleteTopologyRequest}
              />
            )}
            onSelectionChange={onSelectionChange}
            onToggle={e => setExpandedKeys(e.value)}
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
