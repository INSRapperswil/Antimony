import React, {useEffect, useMemo, useState} from 'react';

import YAML from 'yaml';
import {confirmDialog, ConfirmDialog} from 'primereact/confirmdialog';

import {useResource} from '@sb/lib/Hooks';
import {
  ClabSchema,
  DeviceInfo,
  Group,
  Topology,
  TopologyDefinition,
  TopologyOut,
} from '@sb/types/Types';
import {APIConnector} from '@sb/lib/APIConnector';
import {NotificationController} from '@sb/lib/NotificationController';
import TopologyEditor from '@sb/components/AdminPage/TopologyEditor/TopologyEditor';
import TopologyExplorer from '@sb/components/AdminPage/TopologyExplorer/TopologyExplorer';

import './AdminPage.sass';
import classNames from 'classnames';

interface AdminPageProps {
  apiConnector: APIConnector;
  notificationController: NotificationController;
}

const AdminPage: React.FC<AdminPageProps> = (props: AdminPageProps) => {
  const [selectedTopology, setSelectedTopology] = useState<Topology | null>(
    null
  );

  // Whether the current topology has pending changes to save
  const [pendingEdits, setPendingEdits] = useState(false);

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

  const [clabSchema] = useResource<ClabSchema | null>(
    process.env.SB_CLAB_SCHEMA_URL!,
    props.apiConnector,
    null,
    null,
    true
  );

  const deviceLookup = useMemo(
    () => new Map(devices.map(device => [device.kind, device])),
    [devices]
  );

  const topologyLookup = useMemo(
    () => new Map(topologies.map(topology => [topology.id, topology])),
    [topologies]
  );

  useEffect(() => {
    /// #if DEBUG
    if (topologies && topologies.length > 0) {
      setSelectedTopology(topologies[0]);
    }
    /// #endif

    // Refresh currently selected topology when topologies are reloaded
    if (selectedTopology && topologyLookup.has(selectedTopology.id)) {
      setSelectedTopology(topologyLookup.get(selectedTopology.id)!);
    }
  }, [topologies, topologyLookup, selectedTopology]);

  const [groups] = useResource<Group[]>('/groups', props.apiConnector, []);

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
    if (!topologyLookup.has(id)) return false;

    console.log('pending: ', pendingEdits);
    if (pendingEdits) {
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
    setPendingEdits(false);
    setSelectedTopology(topologyLookup.get(id)!);
  }

  function onSaveTopology(topology: TopologyDefinition): boolean {
    console.log('Topology is now saved!');
    setSelectedTopology({...selectedTopology!, definition: topology});
    setPendingEdits(false);

    fetchTopologies();
    return true;
  }

  return (
    <>
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
          selectedTopology={selectedTopology}
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
            clabSchema={clabSchema}
            apiConnector={props.apiConnector}
            selectedTopology={selectedTopology}
            onSaveTopology={onSaveTopology}
            hasPendingEdits={pendingEdits}
            setPendingEdits={setPendingEdits}
            deviceLookup={deviceLookup}
            isMaximized={isMaximized}
            setMaximized={setMaximized}
            notificationController={props.notificationController}
          />
        </div>
      </div>
      <ConfirmDialog />
    </>
  );
};

export default AdminPage;
