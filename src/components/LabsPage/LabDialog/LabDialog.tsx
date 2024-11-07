import {useDeviceStore, useTopologyStore} from '@sb/lib/stores/RootStore';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {Edge, Node} from 'vis';
import {Network} from 'vis-network';
import Graph from 'react-graph-vis';
import {Button} from 'primereact/button';
import useResizeObserver from '@react-hook/resize-observer';

import {Lab, TopologyDefinition, YAMLDocument} from '@sb/types/Types';
import {NetworkOptions} from '@sb/components/AdminPage/TopologyEditor/NodeEditor/network.conf';

import './LabDialog.sass';
import {ContextMenu} from 'primereact/contextmenu';
import {Checkbox} from 'primereact/checkbox';
import {drawGrid} from '@sb/lib/utils/Utils';

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
  const [hostsHidden, setHostsHidden] = useState<boolean>(false);
  const nodeContextMenuRef = useRef<ContextMenu | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  const deviceStore = useDeviceStore();
  const topologyStore = useTopologyStore();

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

      // Update label based on `hostsVisible`
      nodes.push({
        id: index,
        label: !hostsHidden
          ? `${nodeName}\n${props.lab.nodeMeta[index]?.webSsh + ':' + props.lab.nodeMeta[index]?.port || ''}`
          : nodeName,
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
  }, [topologyDefinition, deviceStore, hostsHidden, props.lab.nodeMeta]);

  // Function to update network data
  const updateGraphData = useCallback(() => {
    if (network) {
      network.setData(graph);
    }
  }, [network, graph]);

  // Update graph whenever `network` or `hostsVisible` changes
  useEffect(() => {
    if (network) {
      updateGraphData();
    }
  }, [network, updateGraphData]);

  function onNetworkContext(selectData: NodeClickEvent) {
    if (!nodeContextMenuRef.current) return;

    const targetNode = network?.getNodeAt(selectData.pointer.DOM);
    if (targetNode !== undefined) {
      network?.selectNodes([targetNode]);
      setSelectedNode(targetNode as number);
      nodeContextMenuRef.current.show(selectData.event);
    }
  }

  const networkContextMenuItems = useMemo(() => {
    if (selectedNode !== null) {
      return [
        {
          label: 'Copy Host',
          icon: 'pi pi-copy',
        },
        {
          label: 'Web SSH',
          icon: 'pi pi-external-link',
        },
      ];
    }
  }, [selectedNode]);

  useEffect(() => {
    if (!network) return;
    network.on('beforeDrawing', drawGrid);

    return () => network.off('beforeDrawing', drawGrid);
  }, [network]);

  useEffect(() => {
    getTopology(props.lab.topologyId);
  }, [props.lab.topologyId, getTopology]);

  return (
    <div className="height-100 topology-container">
      <div className="height-100">
        <div className="topology-header">
          <Button
            onClick={() => window.open(props.lab.edgesharkLink, '_blank')}
            className="topology-button"
          >
            🦈 Start EdgeShark
          </Button>
          <div className="dialog-actions">
            <Checkbox
              inputId="hostsVisibleCheckbox"
              checked={hostsHidden}
              onChange={e => setHostsHidden(e.checked!)}
            />
            <label htmlFor="hostsVisibleCheckbox">Hide hosts</label>
          </div>
        </div>
        <div className="height-100 topology-graph-container">
          <Graph
            graph={{nodes: [], edges: []}}
            options={NetworkOptions}
            events={{
              oncontext: onNetworkContext,
            }}
            getNetwork={setNetwork}
          />
        </div>
        <ContextMenu model={networkContextMenuItems} ref={nodeContextMenuRef} />
        <div className="topology-footer">
          {/*<Dialog
            header={
              <div className="conformation-dialog-header">
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
                  className="p-button p-component bold"
                  onClick={() => setDialogVisible(false)}
                >
                  Cancel
                </Button>
                <Button className="p-button p-component">Abort</Button>
              </div>
            </div>
          </Dialog>*/}
        </div>
      </div>
    </div>
  );
};

interface NodeClickEvent {
  nodes: Node[];
  edges: Edge[];
  event: React.SyntheticEvent;
  pointer: {
    DOM: {
      x: number;
      y: number;
    };
    canvas: {
      x: number;
      y: number;
    };
  };
}

export default LabDialog;
