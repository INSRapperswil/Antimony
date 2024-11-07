import TopologyEditor from '@sb/components/AdminPage/TopologyEditor/TopologyEditor';
import TopologyExplorer from '@sb/components/AdminPage/TopologyExplorer/TopologyExplorer';
import {NotificationControllerContext} from '@sb/lib/NotificationController';
import {RootStoreContext} from '@sb/lib/stores/RootStore';

import {Choose, When} from '@sb/types/control';
import {FetchState, Topology} from '@sb/types/Types';

import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import React, {useCallback, useContext, useEffect, useState} from 'react';

import './AdminPage.sass';
import {Navigate} from 'react-router-dom';

const AdminPage: React.FC = observer(() => {
  const [editingTopologyId, setEditingTopologyId] = useState<string | null>(
    null
  );
  const [isMaximized, setMaximized] = useState(false);

  const apiStore = useContext(RootStoreContext).apiConnectorStore;
  const topologyStore = useContext(RootStoreContext).topologyStore;
  const notificationController = useContext(NotificationControllerContext);

  const onTopologyOpen = useCallback((topology: Topology) => {
    setEditingTopologyId(topology.id);
  }, []);

  useEffect(() => {
    topologyStore.manager.onOpen.register(onTopologyOpen);

    return () => topologyStore.manager.onOpen.unregister(onTopologyOpen);
  }, [topologyStore, onTopologyOpen]);

  useEffect(() => {
    /// #if DEBUG
    if (topologyStore.topologies.length > 0) {
      topologyStore.manager.open(topologyStore.topologies[0]);
    }
    /// #endif

    if (topologyStore.manager.editingTopologyId) {
      if (topologyStore.lookup.has(topologyStore.manager.editingTopologyId)) {
        topologyStore.manager.open(
          topologyStore.lookup.get(topologyStore.manager.editingTopologyId)!
        );
      } else {
        topologyStore.manager.close();
      }
    }
  }, [
    topologyStore.fetchReport,
    topologyStore.lookup,
    topologyStore.manager,
    topologyStore.topologies,
  ]);

  function onSelectTopology(id: string) {
    if (!topologyStore.lookup.has(id)) return;

    if (topologyStore.manager.hasEdits()) {
      notificationController.confirm({
        message: 'Discard unsaved changes?',
        header: 'Unsaved Changes',
        icon: 'pi pi-info-circle',
        severity: 'warning',
        onAccept: () => onSelectConfirm(id),
      });
    } else {
      onSelectConfirm(id);
    }
  }

  function onSelectConfirm(id: string) {
    if (topologyStore.lookup.has(id)) {
      topologyStore.manager.open(topologyStore.lookup.get(id)!);
    }
  }

  function onSaveTopology() {
    topologyStore.manager.save();
    notificationController.success('Topology has been saved!');

    topologyStore.fetch();
  }

  return (
    <Choose>
      <When condition={!apiStore.isLoggedIn}>
        <Navigate to="/login" />
      </When>
      <When condition={topologyStore.fetchReport.state === FetchState.Done}>
        <div
          className={classNames(
            'bg-primary',
            'font-bold',
            'height-100',
            'sb-card',
            'overflow-y-auto',
            'overflow-x-hidden',
            'sb-admin-page-left',
            {
              'sb-admin-page-left-maximized': isMaximized,
            }
          )}
        >
          <TopologyExplorer
            selectedTopologyId={editingTopologyId}
            onTopologySelect={onSelectTopology}
          />
        </div>
        <div
          className={classNames('flex-grow-1', 'sb-admin-page-right', {
            'sb-admin-page-right-maximized': isMaximized,
          })}
        >
          <div className="bg-primary font-bold height-100 sb-card overflow-y-auto overflow-x-hidden">
            <TopologyEditor
              onSaveTopology={onSaveTopology}
              isMaximized={isMaximized}
              setMaximized={setMaximized}
            />
          </div>
        </div>
      </When>
    </Choose>
  );
});

export default AdminPage;
