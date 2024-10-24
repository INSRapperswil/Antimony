import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {APIConnector} from '@sb/lib/APIConnector';
import {DeviceInfo, Lab, Topology, TopologyDefinition} from '@sb/types/Types';
import {Edge, Node} from 'vis';
import {Network} from 'vis-network';
import Graph from 'react-graph-vis';
import {NetworkOptions} from '@sb/components/AdminPage/TopologyEditor/NodeEditor/network.conf';
import {Button} from 'primereact/button';
import {useResource} from '@sb/lib/Hooks';
import useResizeObserver from '@react-hook/resize-observer/src';
import {IconMap} from '@sb/components/AdminPage/TopologyEditor/TopologyEditor';

type GraphDefinition = {
  nodes?: Node[];
  edges?: Edge[];
};
interface LabDialogProps {
  lab: Lab;
  apiConnector: APIConnector;
}

const LabDialog: React.FC<LabDialogProps> = (props: LabDialogProps) => {
  const [network, setNetwork] = useState<Network | null>(null);
  const [topologyDefinition, setTopologyDefinition] =
    useState<TopologyDefinition | null>(null);
  const containerRef = useRef(null);
  const [topologies] = useResource<Topology[]>(
    `/topologies`,
    props.apiConnector,
    []
  );

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
    for (let topology of topologies) {
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
        image: getNodeIcon(node.kind),
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
    getTopology(props.lab.id);
    network?.setData(graph);
  }, [network, graph, props.lab]);

  useResizeObserver(containerRef, () => {
    if (network) {
      network.redraw();
    }
  });

  return (
    <div className="height-100">
      <div className="height-100">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1em',
          }}
        >
          <strong style={{textAlign: 'left'}}>Topology</strong>
          <Button
            onClick={() => console.log('EdgeShark Clicked')} // Replace with your handler
            style={{
              backgroundColor: '#4DB6AC',
              color: 'black',
              border: 'none',
              padding: '0.5em 1em',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '1em',
            }}
          >
            🦈 Start EdgeShark
          </Button>
        </div>
        <div>
          <Graph
            graph={{nodes: [], edges: []}}
            options={NetworkOptions}
            getNetwork={setNetwork}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'absolute',
            bottom: '1em',
            left: '1em',
            right: '1em',
            width: 'calc(100% - 2em)',
          }}
        >
          <Button style={{alignSelf: 'flex-start'}}>Reset</Button>
          <Button style={{alignSelf: 'flex-end'}}>Abort</Button>
        </div>
      </div>
    </div>
  );
};

export default LabDialog;
