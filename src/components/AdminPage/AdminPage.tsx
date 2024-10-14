import React, {useState} from 'react';

import './AdminPage.sass';
import TopologyExplorer from '@sb/components/AdminPage/TopologyExplorer/TopologyExplorer';
import {useResource} from '@sb/lib/Hooks';
import {DeviceInfo, Group, Topology} from '@sb/types/Types';
import {APIConnector} from '@sb/lib/APIConnector';
import TopologyEditor from '@sb/components/AdminPage/TopologyEditor/TopologyEditor';

interface AdminPageProps {
  apiConnector: APIConnector;
}

const AdminPage: React.FC<AdminPageProps> = (props: AdminPageProps) => {
  // const [selectedTopology, setSelectedTopology] = useState<Topology | null>({
  //   id: '123456',
  //   name: 'Example Topology',
  //   groupId: '123',
  //   creatorId: 'abc',
  //   definition: '',
  // });
  const [selectedTopology, setSelectedTopology] = useState<Topology | null>(
    null
  );

  const [topologies, topologyFetchState] = useResource<Topology[]>(
    '/topologies',
    props.apiConnector,
    []
  );

  const [devices] = useResource<DeviceInfo[]>(
    '/devices',
    props.apiConnector,
    []
  );

  const [groups] = useResource<Group[]>('/groups', props.apiConnector, []);

  function onSelectTopology(id: string) {
    setSelectedTopology(topologies.find(topology => topology.id === id)!);
  }

  return (
    <>
      <div className="bg-primary font-bold height-100 sb-card overflow-y-scroll overflow-x-hidden sb-admin-page-left">
        <TopologyExplorer
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
            devices={devices}
          />
        </div>
      </div>
    </>
  );
};

export default AdminPage;
