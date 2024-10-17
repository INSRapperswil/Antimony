import React, {useEffect, useState} from 'react';

import './AdminPage.sass';
import TopologyExplorer from '@sb/components/AdminPage/TopologyExplorer/TopologyExplorer';
import {useResource} from '@sb/lib/Hooks';
import {
  DeviceInfo,
  Group,
  Topology,
  TopologyDefinition,
  TopologyOut,
} from '@sb/types/Types';
import {APIConnector} from '@sb/lib/APIConnector';
import TopologyEditor from '@sb/components/AdminPage/TopologyEditor/TopologyEditor';
import {NotificationController} from '@sb/lib/NotificationController';
import {confirmDialog, ConfirmDialog} from 'primereact/confirmdialog';
import YAML from 'yaml';

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

  const [topologies, topologyFetchState] = useResource<Topology[]>(
    '/topologies',
    props.apiConnector,
    [],
    topologies => mapTopologies(topologies as TopologyOut[])
  );

  const [topologyLookup, setTopologyLookup] = useState<Map<string, Topology>>(
    new Map()
  );

  const [devices] = useResource<DeviceInfo[]>(
    '/devices',
    props.apiConnector,
    []
  );

  // TODO(kian): REMOVE DEBUG
  useEffect(() => {
    if (topologies && topologies.length > 0) {
      setSelectedTopology(topologies[0]);
    }
  }, [topologies]);

  useEffect(() => {
    setTopologyLookup(
      new Map(topologies.map(topology => [topology.id, topology]))
    );
  }, [topologies]);

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
    console.log('Toplogy is now saved!');
    setPendingEdits(false);
    return true;
  }

  return (
    <>
      <div className="bg-primary font-bold height-100 sb-card overflow-y-scroll overflow-x-hidden sb-admin-page-left">
        <TopologyExplorer
          selectedTopology={selectedTopology}
          onTopologySelect={onSelectTopology}
          groups={groups}
          topologies={topologies}
          devices={devices}
          fetchState={topologyFetchState}
        />
      </div>
      <div className="flex-grow-1">
        <div className="bg-primary font-bold height-100 sb-card overflow-y-scroll overflow-x-hidden">
          <TopologyEditor
            apiConnector={props.apiConnector}
            selectedTopology={selectedTopology}
            onSaveTopology={onSaveTopology}
            hasPendingEdits={pendingEdits}
            onEdit={setPendingEdits}
            devices={devices}
            notificationController={props.notificationController}
          />
        </div>
      </div>
      <ConfirmDialog />
    </>
  );
};

export default AdminPage;
