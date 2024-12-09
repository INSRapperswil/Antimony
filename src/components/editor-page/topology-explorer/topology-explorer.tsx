import GroupEditDialog from '@sb/components/editor-page/topology-explorer/group-edit-dialog/group-edit-dialog';
import {Choose, Otherwise, When} from '@sb/types/control';
import {observer} from 'mobx-react-lite';
import {ContextMenu} from 'primereact/contextmenu';
import {MenuItem} from 'primereact/menuitem';
import {Message} from 'primereact/message';
import React, {MouseEvent, useEffect, useMemo, useRef, useState} from 'react';

import {Tooltip} from 'primereact/tooltip';
import {TreeNode} from 'primereact/treenode';
import {
  Tree,
  TreeEventNodeEvent,
  TreeExpandedKeysType,
  TreeSelectionEvent,
} from 'primereact/tree';

import {
  ErrorResponse,
  Group,
  Topology,
  PostResponse,
  uuid4,
} from '@sb/types/types';
import SBConfirm from '@sb/components/common/sb-confirm/sb-confirm';
import {
  useGroupStore,
  useNotifications,
  useTopologyStore,
} from '@sb/lib/stores/root-store';
import ExplorerTreeNode from '@sb/components/editor-page/topology-explorer/explorer-tree-node/explorer-tree-node';

import './topology-explorer.sass';
import YAML from 'yaml';
import {TopologyManager} from '@sb/lib/topology-manager';

interface TopologyBrowserProps {
  selectedTopologyId?: string | null;

  onTopologySelect: (id: uuid4) => void;
  onTopologyDeploy: (id: uuid4) => void;
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

    // DEBUG: UNCOMMENT THIS FOR AN ERORR
    // console.log('eror:', topologyTree[3].test);

    for (const topology of topologyStore.data) {
      if (topologiesByGroup.has(topology.groupId)) {
        topologiesByGroup.get(topology.groupId)!.push(topology);
      } else {
        topologiesByGroup.set(topology.groupId, [topology]);
      }
    }

    for (const group of groupStore.data) {
      topologyTree.push({
        key: group.id,
        label: group.name,
        icon: 'pi pi-folder',
        selectable: false,
        leaf: false,
        children: topologiesByGroup.get(group.id)?.map(topology => ({
          key: topology.id,
          label: topology.definition.getIn(['name']) as string,
          icon: <span className="material-symbols-outlined">lan</span>,
          leaf: true,
          selectable: true,
        })),
      });
    }

    return topologyTree;
  }, [groupStore.data, topologyStore.data]);

  useEffect(() => {
    setExpandedKeys(
      Object.fromEntries(topologyTree.map(group => [group.key, true]))
    );
  }, [topologyTree]);

  function onSelectionChange(e: TreeSelectionEvent) {
    if (e.value === null) return;

    props.onTopologySelect(e.value as string);
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

  function onDeleteTopology(id: string) {
    topologyStore.delete(id).then(error => {
      if (error) {
        notificationStore.error(error.message, 'Failed to delete topology');
      } else {
        notificationStore.success('Topology has been deleted.');
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

  async function onAddTopology(groupId: uuid4) {
    const [status, response] = await topologyStore.add({
      groupId: groupId,
      definition: YAML.stringify({
        name: TopologyManager.generateUniqueName(groupId, topologyStore.data),
        topology: {nodes: {}},
      }),
    });

    if (!status) {
      notificationStore.error(
        (response as ErrorResponse).message,
        'Failed to add new topology.'
      );
    } else {
      notificationStore.success('Topology has been created.');
      props.onTopologySelect((response as PostResponse).id);
    }
  }

  function onDeleteGroupRequest(id: string) {
    if (!groupStore.lookup.has(id)) return;

    const childTopologies = topologyStore.data.filter(
      topology => topology.groupId === id
    );

    notificationStore.confirm({
      header: `Delete Group "${groupStore.lookup.get(id)!.name}"?`,
      content: (
        <Choose>
          <When condition={childTopologies.length > 0}>
            <div className="sb-confirm-list">
              <span>The following topologies will be deleted as well</span>
              <ul>
                {childTopologies.map(topology => (
                  <li>{topology.definition.get('name') as string}</li>
                ))}
              </ul>
              <Message severity="warn" text="This action cannot be undone!" />
            </div>
          </When>
          <Otherwise>{'This action cannot be undone!'}</Otherwise>
        </Choose>
      ),
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      onAccept: () => onDeleteGroup(id),
    });
  }

  function onDeleteTopologyRequest(id: string) {
    if (!topologyStore.lookup.has(id)) return;

    notificationStore.confirm({
      header: `Delete Topology "${topologyStore.lookup
        .get(id)!
        .definition.get('name')}"?`,
      message: 'This action cannot be undone!',
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      onAccept: () => onDeleteTopology(id),
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

  const onAddTopologyContext = () => {
    if (
      !contextMenuTarget.current ||
      !topologyStore.lookup.has(contextMenuTarget.current)
    ) {
      return;
    }

    void onAddTopology(
      topologyStore.lookup.get(contextMenuTarget.current)!.groupId
    );
  };

  const onDeployTopologyContext = () => {
    if (!contextMenuTarget.current) return;
    props.onTopologyDeploy(contextMenuTarget.current);
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
      command: onDeployTopologyContext,
    },
    {
      id: 'create',
      label: 'Add Topology',
      icon: 'pi pi-plus',
      command: onAddTopologyContext,
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
            onAddTopology={onAddTopology}
            onDeployTopology={props.onTopologyDeploy}
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
