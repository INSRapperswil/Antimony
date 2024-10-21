import React, {useCallback, useEffect, useMemo, useState} from 'react';

import YAML from 'yaml';
import {confirmDialog, ConfirmDialog} from 'primereact/confirmdialog';

import {
  Instantiatable,
  useReady,
  useResource,
  useSingleton,
} from '@sb/lib/Hooks';
import {
  ClabSchema,
  DeviceInfo,
  Group,
  Topology,
  TopologyOut,
} from '@sb/types/Types';
import {APIConnector} from '@sb/lib/APIConnector';
import {NotificationController} from '@sb/lib/NotificationController';
import TopologyEditor from '@sb/components/AdminPage/TopologyEditor/TopologyEditor';
import TopologyExplorer from '@sb/components/AdminPage/TopologyExplorer/TopologyExplorer';

import './AdminPage.sass';
import classNames from 'classnames';
import {TopologyManager} from '@sb/lib/TopologyManager';
import {If} from '@sb/types/control';

interface AdminPageProps {
  apiConnector: APIConnector;
  notificationController: NotificationController;
}

const AdminPage: React.FC<AdminPageProps> = (props: AdminPageProps) => {
  // const [selectedTopology, setSelectedTopology] = useState<Topology | null>(
  //   null
  // );

  const [editingTopologyId, setEditingTopologyId] = useState<string | null>(
    null
  );

  const [isMaximized, setMaximized] = useState(false);

  const [topologies, topologyFetchState, fetchTopologies] = useResource<
    Topology[]
  >('/topologies', props.apiConnector, [], topologies =>
    mapTopologies(topologies as TopologyOut[])
  );

  const [devices] = useResource<DeviceInfo[]>(
    '/devices',
    props.apiConnector,
    []
  );

  const topologyManager = useSingleton(
    TopologyManager as Instantiatable<TopologyManager>,
    props.apiConnector,
    props.notificationController
  );

  const [clabSchema] = useResource<ClabSchema | null>(
    process.env.SB_CLAB_SCHEMA_URL!,
    props.apiConnector,
    null,
    null,
    true
  );

  const [groups] = useResource<Group[]>('/groups', props.apiConnector, []);

  const deviceLookup = useMemo(
    () => new Map(devices.map(device => [device.kind, device])),
    [devices]
  );

  const topologyLookup = useMemo(
    () => new Map(topologies.map(topology => [topology.id, topology])),
    [topologies]
  );

  const isReady = useReady(
    topologyManager,
    deviceLookup,
    topologyLookup,
    clabSchema,
    groups
  );

  const onTopologyOpen = useCallback((topology: Topology) => {
    setEditingTopologyId(topology.id);
  }, []);

  useEffect(() => {
    if (!topologyManager) return;

    topologyManager.onOpen.register(onTopologyOpen);

    return () => topologyManager.onOpen.unregister(onTopologyOpen);
  }, [topologyManager, onTopologyOpen]);

  useEffect(() => {
    /// #if DEBUG
    if (topologies && topologies.length > 0 && topologyManager) {
      topologyManager.open(topologies[0]);
      // setSelectedTopology(topologies[0]);
    }
    /// #endif

    // Refresh currently selected topology when topologies are reloaded and topology was open before
    if (topologyManager && topologyManager.editingTopologyId) {
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
    if (!topologyManager) return;

    console.log('dasdds:', id);
    console.log(topologyLookup);
    if (!topologyLookup.has(id)) return false;
    console.log('dasdds:', id);

    if (topologyManager.hasEdits()) {
      console.log('penidng edits', id);
      confirmDialog({
        message: "Are you sure you wan't to leave?",
        header: 'Unsaved Changes',
        icon: 'pi pi-info-circle',
        defaultFocus: 'reject',
        acceptClassName: 'p-button-danger',
        accept: () => onSelectConfirm(id),
      });
    } else {
      console.log('no   penidng edits', id);

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
          'overflow-y-scroll',
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
          fetchState={topologyFetchState}
        />
      </div>
      <div
        className={classNames('flex-grow-1', 'sb-admin-page-right', {
          'sb-admin-page-right-maximized': isMaximized,
        })}
      >
        <div className="bg-primary font-bold height-100 sb-card overflow-y-scroll overflow-x-hidden">
          <TopologyEditor
            onSaveTopology={onSaveTopology}
            topologyManager={topologyManager!}
            clabSchema={clabSchema!}
            apiConnector={props.apiConnector}
            deviceLookup={deviceLookup}
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
