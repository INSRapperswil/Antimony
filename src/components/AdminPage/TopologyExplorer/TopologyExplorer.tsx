import ExplorerTreeNode from '@sb/components/AdminPage/TopologyExplorer/ExplorerTreeNode/ExplorerTreeNode';
import SBConfirm from '@sb/components/common/SBConfirm';
import {NotificationController} from '@sb/lib/NotificationController';
import React, {useCallback, useEffect, useState} from 'react';

import {Tree, TreeExpandedKeysType, TreeSelectionEvent} from 'primereact/tree';
import {Tooltip} from 'primereact/tooltip';
import {TreeNode} from 'primereact/treenode';
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
  const [topologyTree, setTopologyTree] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});

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

  function onSelectionChange(e: TreeSelectionEvent) {
    if (e.value === null) return;

    props.onTopologySelect(e.value as string);
  }

  function onRenameGroup(uuid: string, value: string) {
    console.log('Renaming group: ', uuid, ' to ', value);
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
