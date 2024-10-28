import React, {useCallback, useEffect, useMemo, useState} from 'react';

import YAML from 'yaml';
import classNames from 'classnames';
import {confirmDialog, ConfirmDialog} from 'primereact/confirmdialog';

import {
  Instantiatable,
  useReady,
  useResource,
  useSingleton,
} from '@sb/lib/Utils/Hooks';
import {
  ClabSchema,
  DeviceInfo,
  Group,
  Topology,
  TopologyOut,
} from '@sb/types/Types';
import {If} from '@sb/types/control';
import {APIConnector} from '@sb/lib/APIConnector';
import {DeviceManager} from '@sb/lib/DeviceManager';
import {TopologyManager} from '@sb/lib/TopologyManager';
import {NotificationController} from '@sb/lib/NotificationController';
import TopologyEditor from '@sb/components/AdminPage/TopologyEditor/TopologyEditor';
import TopologyExplorer from '@sb/components/AdminPage/TopologyExplorer/TopologyExplorer';

import './AdminPage.sass';

interface AdminPageProps {
  apiConnector: APIConnector;
  notificationController: NotificationController;
}

const AdminPage: React.FC<AdminPageProps> = (props: AdminPageProps) => {
  const [editingTopologyId, setEditingTopologyId] = useState<string | null>(
    null
  );

  const [isMaximized, setMaximized] = useState(false);

  const topologyManager = useSingleton(
    TopologyManager as Instantiatable<TopologyManager>,
    props.apiConnector,
    props.notificationController
  );

  const [topologies, , fetchTopologies] = useResource<Topology[]>(
    '/topologies',
    props.apiConnector,
    [],
    topologies => mapTopologies(topologies as TopologyOut[])
  );

  const [devices] = useResource<DeviceInfo[]>(
    '/devices',
    props.apiConnector,
    []
  );

  const [clabSchema] = useResource<ClabSchema | null>(
    process.env.SB_CLAB_SCHEMA_URL!,
    props.apiConnector,
    null,
    null,
    true
  );

  const [groups, groupsFetchState] = useResource<Group[]>(
    '/groups',
    props.apiConnector,
    []
  );

  const topologyLookup = useMemo(() => {
    if (!topologies) return null;
    return new Map(topologies.map(topology => [topology.id, topology]));
  }, [topologies]);

  const deviceManager = useMemo(() => {
    if (!devices) return null;
    return new DeviceManager(devices);
  }, [devices]);

  const onTopologyOpen = useCallback((topology: Topology) => {
    setEditingTopologyId(topology.id);
  }, []);

  const isReady = useReady(topologyManager, deviceManager, topologyLookup);

  useEffect(() => {
    if (!topologyManager) return;

    topologyManager.onOpen.register(onTopologyOpen);

    return () => topologyManager.onOpen.unregister(onTopologyOpen);
  }, [topologyManager, onTopologyOpen]);

  useEffect(() => {
    if (!topologyLookup || !topologies || !topologyManager) return;

    /// #if DEBUG
    if (topologies && topologies.length > 0) {
      topologyManager.open(topologies[0]);
    }
    /// #endif

    if (topologyManager.editingTopologyId) {
      if (topologyLookup.has(topologyManager.editingTopologyId)) {
        topologyManager.open(
          topologyLookup.get(topologyManager.editingTopologyId)!
        );
      } else {
        topologyManager.close();
      }
    }
  }, [topologies, topologyLookup, topologyManager]);

  function mapTopologies(input: TopologyOut[]) {
    const topologies: Topology[] = [];
    for (const topology of input) {
      try {
        topologies.push({
          ...topology,
          definition: YAML.parse((topology as TopologyOut).definition),
        });
      } catch (e) {
        console.error('[NET] Failed to parse incoming topology: ', topology);
      }
    }

    return topologies;
  }

  function onSelectTopology(id: string) {
    if (!topologyManager || !topologyLookup || !topologyLookup.has(id)) return;

    if (topologyManager.hasEdits()) {
      confirmDialog({
        message: "Are you sure you wan't to leave?",
        header: 'Unsaved Changes',
        icon: 'pi pi-info-circle',
        defaultFocus: 'reject',
        acceptClassName: 'p-button-danger',
        accept: () => onSelectConfirm(id),
      });
    } else {
      onSelectConfirm(id);
    }
  }

  function onSelectConfirm(id: string) {
    if (topologyLookup && topologyLookup.has(id)) {
      topologyManager?.open(topologyLookup.get(id)!);
    }
  }

  function onSaveTopology() {
    topologyManager!.save();
    props.notificationController.success('Topology has been saved!');

    fetchTopologies();
  }

  return (
    <If condition={isReady}>
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
          groups={groups}
          topologies={topologies}
          devices={devices}
          fetchState={groupsFetchState}
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
            topologyManager={topologyManager!}
            clabSchema={clabSchema}
            apiConnector={props.apiConnector}
            deviceManager={deviceManager!}
            isMaximized={isMaximized}
            setMaximized={setMaximized}
            notificationController={props.notificationController}
          />
        </div>
      </div>
      <ConfirmDialog />
    </If>
  );
};

export default AdminPage;
