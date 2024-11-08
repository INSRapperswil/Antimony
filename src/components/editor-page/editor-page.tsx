import TopologyEditor from '@sb/components/editor-page/topology-editor/topology-editor';
import TopologyExplorer from '@sb/components/editor-page/topology-explorer/topology-explorer';
import {useNotifications, useTopologyStore} from '@sb/lib/stores/root-store';

import {Topology} from '@sb/types/types';

import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import React, {useCallback, useEffect, useState} from 'react';

import {useSearchParams} from 'react-router-dom';
import './editor-page.sass';

const EditorPage: React.FC = observer(() => {
  const [isMaximized, setMaximized] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const topologyStore = useTopologyStore();
  const notificatioStore = useNotifications();

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
    if (
      searchParams.has('t') &&
      topologyStore.lookup.has(searchParams.get('t')!)
    ) {
      topologyStore.manager.open(
        topologyStore.lookup.get(searchParams.get('t')!)!
      );
    } else {
      topologyStore.manager.close();
    }
  }, [searchParams, topologyStore.lookup, topologyStore.manager]);

  useEffect(() => {
    console.log('TOPOLOGIES:', topologyStore.topologies);
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
      notificatioStore.confirm({
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
    notificatioStore.success('Topology has been saved!');

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

export default EditorPage;
