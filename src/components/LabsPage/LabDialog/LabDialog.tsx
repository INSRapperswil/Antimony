import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {Edge, Node} from 'vis';
import {Network} from 'vis-network';
import Graph from 'react-graph-vis';
import {Button} from 'primereact/button';
import useResizeObserver from '@react-hook/resize-observer';

import {
  DeviceInfo,
  Lab,
  Topology,
  TopologyDefinition,
  TopologyOut,
} from '@sb/types/Types';
import {useResource} from '@sb/lib/Utils/Hooks';
import {APIConnector} from '@sb/lib/APIConnector';
import {DeviceManager} from '@sb/lib/DeviceManager';
import {TopologyManager} from '@sb/lib/TopologyManager';
import {IconMap} from '@sb/components/AdminPage/TopologyEditor/TopologyEditor';
import {NetworkOptions} from '@sb/components/AdminPage/TopologyEditor/NodeEditor/network.conf';
import './LabDialog.sass';

type GraphDefinition = {
  nodes?: Node[];
  edges?: Edge[];
};
interface LabDialogProps {
  lab: Lab;
  apiConnector: APIConnector;
  deviceManager: DeviceManager;
}

const LabDialog: React.FC<LabDialogProps> = (props: LabDialogProps) => {
  const [network, setNetwork] = useState<Network | null>(null);
  const [topologyDefinition, setTopologyDefinition] =
    useState<TopologyDefinition | null>(null);
  const containerRef = useRef(null);

  const [topologies] = useResource<Topology[]>(
    '/topologies',
    props.apiConnector,
    [],
    topologies => TopologyManager.parseTopologies(topologies as TopologyOut[])
  );

  useResizeObserver(containerRef, () => {
    if (network) {
      network.redraw();
    }
  });

  const [devices] = useResource<DeviceInfo[]>(
    '/devices',
    props.apiConnector,
    []
  );

  const deviceLookup = useMemo(
    () => new Map(devices.map(device => [device.kind, device])),
    [devices]
  );

  const getTopology = (id: string): void => {
    for (const topology of topologies) {
      if (topology.id === id) {
        setTopologyDefinition(topology.definition);
      }
    }
  };

  const getNodeIcon = useCallback(
    (kind: string) => {
      let iconName: string;
      const deviceInfo = deviceLookup.get(kind);
      if (deviceInfo) {
        iconName = IconMap.get(deviceInfo?.type) ?? 'generic';
      } else {
        iconName = 'generic';
      }
      if (!iconName) iconName = 'generic';

      return '/assets/icons/' + iconName + '.svg';
    },
    [deviceLookup]
  );

  const graph: GraphDefinition = useMemo(() => {
    if (!topologyDefinition) return {nodes: [], edges: []};

    const nodeMap = new Map<string, number>();
    const nodes: Node[] = [];

    for (const [index, [nodeName, node]] of Object.entries(
      topologyDefinition.topology.nodes
    ).entries()) {
      if (!node) continue;

      nodeMap.set(nodeName, index);
      nodes.push({
        id: index,
        label: nodeName,
        image: props.deviceManager.getNodeIcon(node),
      });
    }

    const edges: Edge[] = [
      ...topologyDefinition.topology.links.entries().map(([index, link]) => ({
        id: index,
        from: nodeMap.get(link.endpoints[0].split(':')[0]),
        to: nodeMap.get(link.endpoints[1].split(':')[0]),
      })),
    ];

    return {nodes: nodes, edges: edges};
  }, [topologyDefinition, getNodeIcon]);

  useEffect(() => {
    getTopology(props.lab.topologyId);
    console.log('graph: ', graph);
    network?.setData(graph);
  }, [network, graph, props.lab]);

  return (
    <div className="height-100 topology-container">
      <div className="height-100">
        <div className="topology-header">
          <strong className="topology-title">Topology</strong>
          <Button
            onClick={() => console.log('EdgeShark Clicked')} // Replace with handler
            className="topology-button"
          >
            🦈 Start EdgeShark
          </Button>
        </div>
        <div className="height-100 topology-graph-container">
          <Graph
            graph={{nodes: [], edges: []}}
            options={NetworkOptions}
            getNetwork={setNetwork}
          />
        </div>
        <div className="topology-footer">
          <Button style={{alignSelf: 'flex-start'}}>Reset</Button>
          <Button style={{alignSelf: 'flex-end'}}>Abort</Button>
        </div>
      </div>
    </div>
  );
};

export default LabDialog;
