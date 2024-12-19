import React, {MouseEvent, useEffect, useMemo, useRef, useState} from 'react';

import {
  Tree,
  TreeEventNodeEvent,
  TreeExpandedKeysType,
  TreeSelectionEvent,
} from 'primereact/tree';
import {observer} from 'mobx-react-lite';
import {Button} from 'primereact/button';
import {Message} from 'primereact/message';
import {Tooltip} from 'primereact/tooltip';
import {TreeNode} from 'primereact/treenode';
import {MenuItem} from 'primereact/menuitem';
import {ContextMenu} from 'primereact/contextmenu';

import {
  useGroupStore,
  useNotifications,
  useTopologyStore,
} from '@sb/lib/stores/root-store';
import {Group, Topology, uuid4} from '@sb/types/types';
import {Choose, Otherwise, When} from '@sb/types/control';
import SBConfirm from '@sb/components/common/sb-confirm/sb-confirm';
import GroupEditDialog from './group-edit-dialog/group-edit-dialog';
import ExplorerTreeNode from './explorer-tree-node/explorer-tree-node';
import TopologyAddDialog from '@sb/components/editor-page/topology-editor/topology-add-dialog/topology-add-dialog';

import './topology-explorer.sass';
import {Image} from 'primereact/image';

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

  // Set to non-null value if the create topology dialog is shown.
  const [createTopologyGroup, setCreateTopologGroup] = useState<string | null>(
    null
  );

  const topologyStore = useTopologyStore();
  const groupStore = useGroupStore();
  const notificationStore = useNotifications();

  const contextMenuRef = useRef<ContextMenu | null>(null);
  const contextMenuTarget = useRef<string | null>(null);

  const topologyTree = useMemo(() => {
    const topologyTree: TreeNode[] = [];
    const topologiesByGroup = new Map<string, Topology[]>();

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

  async function onAddTopology(groupId: uuid4 | null) {
    setCreateTopologGroup(groupId);
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

  function onTopologyAdded(topologyId: string) {
    props.onTopologySelect(topologyId);
    setCreateTopologGroup(null);
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
      label: 'Add Topology',
      icon: 'pi pi-plus',
      command: () => onAddTopology(contextMenuTarget.current),
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
    <div className="sb-topology-explorer" onContextMenu={onContextMenu}>
      <Tooltip target=".tree-node" />
      <Tree
        filter
        filterMode="lenient"
        filterPlaceholder="Search"
        value={topologyTree}
        className="w-full"
        emptyMessage={
          <div className="sb-topology-explorer-empty">
            <Image src="/assets/icons/no-results.png" width="100px" />
            <span>No topologies found :(</span>
          </div>
        }
        pt={{
          toggler: {
            'aria-label': 'Expand Node',
          },
        }}
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
      <TopologyAddDialog
        groupId={createTopologyGroup}
        onCreated={onTopologyAdded}
        onClose={() => setCreateTopologGroup(null)}
      />
      <GroupEditDialog
        key={editingGroup?.id}
        editingGroup={editingGroup}
        isOpen={isEditGroupOpen}
        onClose={() => setEditGroupOpen(false)}
      />
      <SBConfirm />
      <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
      <Button
        className="sb-topology-explorer-add-group"
        icon="pi pi-plus"
        onClick={onAddGroup}
        aria-label="Add Group"
      />
    </div>
  );
});

export default TopologyExplorer;
