import React, {useEffect, useState} from 'react';
import {APIConnector} from '@sb/lib/APIConnector';
import YAML from 'yaml';
import {DeviceInfo, Lab, Topology, TopologyDefinition} from '@sb/types/Types';
import {Edge, Node} from 'vis';
import {Network} from 'vis-network';
import Graph from 'react-graph-vis';
import {NetworkOptions} from '@sb/components/AdminPage/TopologyEditor/NodeEditor/network.conf';
import {Button} from 'primereact/button';

interface LabDialogProps {
  lab: Lab;
  topologies: Topology[];
  devices: DeviceInfo[];
  apiConnector: APIConnector;
}
const LabDialog: React.FC<LabDialogProps> = (props: LabDialogProps) => {
  const [network, setNetwork] = useState<Network | null>(null);
  const IconMap = new Map([
    ['VM', 'virtualserver'],
    ['Generic', 'generic'],
    ['Router', 'router'],
    ['Switch', 'switch'],
    ['Container', 'computer'],
  ]);

  const [deviceInfoMap, setDeviceInfoMap] = useState<Map<string, DeviceInfo>>(
    new Map()
  );

  useEffect(() => {
    getTopology(props.lab.topologyId);
  }, [network, props.lab]);

  const getTopology = (id: string): void => {
    for (let topology of props.topologies) {
      if (topology.id === id) {
        generateGraph(topology.definition);
      }
    }
  };

  useEffect(() => {
    setDeviceInfoMap(
      new Map(props.devices.map(device => [device.kind, device]))
    );
  }, []);

  function getNodeIcon(kind: string) {
    let iconName;
    const deviceInfo = deviceInfoMap.get(kind);
    if (deviceInfo) {
      iconName = IconMap.get(deviceInfo?.type);
    } else {
      iconName = 'generic';
    }
    if (!iconName) iconName = 'generic';

    return './icons/' + iconName + '.svg';
  }

  function generateGraph(topology: string) {
    if (!topology) return;
    const obj = YAML.parse(topology) as TopologyDefinition;
    const nodeMap = new Map<string, number>();

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    for (const [index, [nodeName, node]] of Object.entries(
      obj.topology.nodes
    ).entries()) {
      if (!node) continue;

      nodeMap.set(nodeName, index);
      nodes.push({
        id: index,
        label: nodeName,
        image: getNodeIcon(node.kind),
      });
    }

    for (const [index, link] of obj.topology.links.entries()) {
      edges.push({
        id: index,
        from: nodeMap.get(link.endpoints[0].split(':')[0]),
        to: nodeMap.get(link.endpoints[1].split(':')[0]),
      });
    }

    network?.setData({nodes: nodes, edges: edges});
  }
  return (
    <div
      style={{
        flexGrow: 1, // Allow this div to grow to fill available space
        flexShrink: 1,
        flexBasis: 'auto',
        height: '100%', // Make this container take the available height
        overflow: 'hidden', // Prevent overflow issues
        justifyContent: 'space-between',
      }}
    >
      <div>
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
            style={{
              width: '100%',
              height: '300px',
            }}
          />
        </div>
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
  );
};

export default LabDialog;
