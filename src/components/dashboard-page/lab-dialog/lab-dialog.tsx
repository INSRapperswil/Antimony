import {useDeviceStore, useTopologyStore} from '@sb/lib/stores/root-store';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {Edge, Node} from 'vis';
import {Network} from 'vis-network';
import Graph from 'react-graph-vis';
import {Button} from 'primereact/button';
import useResizeObserver from '@react-hook/resize-observer';

import {Lab, TopologyDefinition, YAMLDocument} from '@sb/types/types';
import {NetworkOptions} from '@sb/components/editor-page/topology-editor/node-editor/network.conf';

import './lab-dialog.sass';
import {ContextMenu} from 'primereact/contextmenu';
import {Checkbox} from 'primereact/checkbox';
import {drawGrid} from '@sb/lib/utils/utils';
import SBDialog from '@sb/components/common/sb-dialog/sb-dialog';

type GraphDefinition = {
  nodes?: Node[];
  edges?: Edge[];
};

interface LabDialogProps {
  lab: Lab;
  groupName: String;
  closeDialog: () => void;
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
          ? `${nodeName}\n${
              props.lab.nodeMeta[index]?.webSsh +
                ':' +
                props.lab.nodeMeta[index]?.port || ''
            }`
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
    <SBDialog
      isOpen={props.lab !== null}
      onClose={props.closeDialog}
      headerTitle={props.groupName + ', ' + props.lab.name}
      className="lab-Dialog overflow-y-hidden overflow-x-hidden"
    >
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
      </div>
    </SBDialog>
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
