import TopologyEditor from '@sb/components/AdminPage/TopologyEditor/TopologyEditor';
import TopologyExplorer from '@sb/components/AdminPage/TopologyExplorer/TopologyExplorer';
import {NotificationControllerContext} from '@sb/lib/NotificationController';
import {RootStoreContext} from '@sb/lib/stores/RootStore';

import {Topology} from '@sb/types/Types';

import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import React, {useCallback, useContext, useEffect, useState} from 'react';

import './AdminPage.sass';
import {useSearchParams} from 'react-router-dom';

const AdminPage: React.FC = observer(() => {
  const [isMaximized, setMaximized] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const topologyStore = useContext(RootStoreContext).topologyStore;
  const notificationController = useContext(NotificationControllerContext);

  const onTopologyOpen = useCallback(
    (topology: Topology) => {
      setSearchParams({t: topology.id});
    },
    [setSearchParams]
  );

  useEffect(() => {
    topologyStore.manager.onOpen.register(onTopologyOpen);

    return () => topologyStore.manager.onOpen.unregister(onTopologyOpen);
  }, [topologyStore, onTopologyOpen]);

  useEffect(() => {
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
    <>
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
          selectedTopologyId={searchParams.get('t')}
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
    </>
  );
});

export default AdminPage;
