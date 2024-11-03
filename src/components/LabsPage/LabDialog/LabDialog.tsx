import {RootStoreContext} from '@sb/lib/stores/RootStore';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {Edge, Node} from 'vis';
import {Network} from 'vis-network';
import Graph from 'react-graph-vis';
import {Button} from 'primereact/button';
import useResizeObserver from '@react-hook/resize-observer';

import {Lab, TopologyDefinition} from '@sb/types/Types';
import {NetworkOptions} from '@sb/components/AdminPage/TopologyEditor/NodeEditor/network.conf';

import './LabDialog.sass';
import {Dialog} from 'primereact/dialog';
import {YAMLDocument} from '@sb/lib/utils/YAMLDocument';

type GraphDefinition = {
  nodes?: Node[];
  edges?: Edge[];
};
interface LabDialogProps {
  lab: Lab;
  groupName: String;
}

const LabDialog: React.FC<LabDialogProps> = (props: LabDialogProps) => {
  const [network, setNetwork] = useState<Network | null>(null);
  const [topologyDefinition, setTopologyDefinition] =
    useState<YAMLDocument<TopologyDefinition> | null>(null);
  const containerRef = useRef(null);
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);

  const topologyStore = useContext(RootStoreContext).topologyStore;
  const deviceStore = useContext(RootStoreContext).deviceStore;

  useResizeObserver(containerRef, () => {
    if (network) {
      network.redraw();
    }
  });

  const getTopology = useCallback(
    (id: string): void => {
      for (const topology of topologyStore.topologies) {
        if (topology.id === id) {
          setTopologyDefinition(topology.definition);
        }
      }
    },
    [topologyStore.topologies]
  );

  const graph: GraphDefinition = useMemo(() => {
    if (!topologyDefinition) return {nodes: [], edges: []};

    const nodeMap = new Map<string, number>();
    const nodes: Node[] = [];

    for (const [index, [nodeName, node]] of Object.entries(
      topologyDefinition.toJS().topology.nodes
    ).entries()) {
      if (!node) continue;

      nodeMap.set(nodeName, index);
      nodes.push({
        id: index,
        label: nodeName,
        image: deviceStore.getNodeIcon(node),
      });
    }

    const edges: Edge[] = [
      ...topologyDefinition
        .toJS()
        .topology.links.entries()
        .map(([index, link]) => ({
          id: index,
          from: nodeMap.get(link.endpoints[0].split(':')[0]),
          to: nodeMap.get(link.endpoints[1].split(':')[0]),
        })),
    ];

    return {nodes: nodes, edges: edges};
  }, [topologyDefinition, deviceStore]);

  useEffect(() => {
    getTopology(props.lab.topologyId);
    network?.setData(graph);
  }, [network, graph, props.lab, getTopology]);

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
          <Button className="p-component" style={{alignSelf: 'flex-start'}}>
            Reset
          </Button>
          <Button
            className="p-component"
            style={{alignSelf: 'flex-end'}}
            onClick={() => {
              setDialogVisible(true);
              console.log('got clicked');
            }}
          >
            Abort
          </Button>
          <Dialog
            header={
              <div className="dialog-header">
                <strong>Abort?</strong>
              </div>
            }
            visible={dialogVisible}
            className="dialog-content-second"
            onHide={() => setDialogVisible(false)}
          >
            <div
              className=""
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <p>do you really want to be abort This Scheduled Lab</p>
              <p>Lab name: {props.lab.name}</p>
              <p>Group name: {props.groupName}</p>
              <div className="abort-buttons">
                <Button
                  className="p-button p-component"
                  onClick={() => setDialogVisible(false)}
                >
                  Cancel
                </Button>
                <Button className="p-button p-component">Abort</Button>
              </div>
            </div>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default LabDialog;
