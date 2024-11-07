import {SpeedDial} from 'primereact/speeddial';
import React, {
  MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {Network} from 'vis-network';
import Graph from 'react-graph-vis';
import {Node, Edge, Position} from 'vis';
import {NetworkOptions} from './network.conf';
import {ContextMenu} from 'primereact/contextmenu';
import useResizeObserver from '@react-hook/resize-observer';

import {TopologyDefinition, YAMLDocument} from '@sb/types/Types';
import {RootStoreContext} from '@sb/lib/stores/RootStore';

import './NodeEditor.sass';
import {drawGrid} from '@sb/lib/utils/Utils';
import {isEqual} from 'lodash';

interface NodeEditorProps {
  openTopology: YAMLDocument<TopologyDefinition> | null;

  onEditNode: (nodeName: string) => void;
  onAddNode: () => void;
}

type GraphDefinition = {
  nodes?: Node[];
  edges?: Edge[];
};

const NodeEditor: React.FC<NodeEditorProps> = (props: NodeEditorProps) => {
  const [network, setNetwork] = useState<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [radialTarget, setRadialTarget] = useState<number | null>(null);

  const deviceStore = useContext(RootStoreContext).deviceStore;
  const topologyStore = useContext(RootStoreContext).topologyStore;

  const nodeContextMenuRef = useRef<ContextMenu | null>(null);
  const containerRef = useRef(null);
  const radialMenuRef = useRef<SpeedDial>(null);

  // Referece to the current graph data since we can't get it from the network
  const currentNetworkData = useRef<GraphDefinition | null>(null);

  // Connection state does not have to be reactive so we use refs
  const nodeConnectTarget = useRef<number | null>(null);
  const nodeConnectTargetPosition = useRef<Position | null>(null);
  const nodeConnectDestination = useRef<Position | null>(null);
  const nodeConnecting = useRef(false);

  useResizeObserver(containerRef, () => {
    if (network) {
      network.redraw();
    }
  });

  const nodeLookup: Map<number, string> = useMemo(() => {
    if (!props.openTopology) return new Map();

    return new Map(
      Object.entries(props.openTopology.toJS().topology.nodes)
        .entries()
        .map(([index, [nodeName]]) => [index, nodeName])
    );
  }, [props.openTopology]);

  const graph: GraphDefinition = useMemo(() => {
    if (!props.openTopology) return {nodes: [], edges: []};

    const nodeMap = new Map<string, number>();
    const nodes: Node[] = [];

    for (const [index, [nodeName, node]] of Object.entries(
      props.openTopology.toJS().topology.nodes
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
      ...props.openTopology
        .toJS()
        .topology.links.entries()
        .map(([index, link]) => ({
          id: index,
          from: nodeMap.get(link.endpoints[0].split(':')[0]),
          to: nodeMap.get(link.endpoints[1].split(':')[0]),
        })),
    ];

    return {nodes: nodes, edges: edges};
  }, [props.openTopology, deviceStore]);

  /*
   * Passing this through the graph's prop directly was causing a weird error. We need to take the imperative way here.
   */
  useEffect(() => {
    if (!network) return;

    // Ignore update if graph hasn't changed
    if (isEqual(currentNetworkData.current, graph)) return;

    currentNetworkData.current = graph;
    network?.setData(graph);
    setSelectedNode(null);
    radialMenuRef.current?.hide();
  }, [network, graph]);

  const networkCanvasContext = useRef<CanvasRenderingContext2D | null>(null);

  const drawConnectionLine = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (
        !network ||
        !nodeConnectTargetPosition.current ||
        !nodeConnectDestination.current
      ) {
        return;
      }

      const target = nodeConnectTargetPosition.current;
      // const destination = getMousePosition(
      //   ctx.canvas,
      //   nodeConnectDestination.current
      // );
      const destination = network.canvasToDOM(nodeConnectDestination.current);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(66 181 172)';
      ctx.moveTo(target.x, target.y);
      ctx.lineTo(destination.x, destination.y);
      ctx.stroke();
    },
    [network]
  );

  const onBeforeDrawing = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      networkCanvasContext.current = ctx;

      drawGrid(ctx);
      drawConnectionLine(ctx);
    },
    [drawConnectionLine]
  );

  useEffect(() => {
    if (!network) return;
    network.on('beforeDrawing', onBeforeDrawing);

    return () => network.off('beforeDrawing', onBeforeDrawing);
  }, [network, onBeforeDrawing]);

  function onMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!nodeConnecting.current || !network) return;

    nodeConnectDestination.current = {x: event.clientX, y: event.clientY};
    network?.redraw();
  }

  function getMousePosition(
    canvas: HTMLCanvasElement,
    evt: Position
  ): Position {
    const rect = canvas.getBoundingClientRect();

    return {
      x: (evt.x - rect.left) * (canvas.width / rect.width),
      y: (evt.y - rect.top) * (canvas.height / rect.height),
    };
  }

  const onNodeConnect = useCallback(() => {
    const selectedNodes = network?.getSelectedNodes();
    if (!selectedNodes || selectedNodes.length < 1) {
      return;
    }
    setRadialTarget(null);
    nodeConnectTarget.current = selectedNodes[0] as number;
    nodeConnectTargetPosition.current =
      network?.getPosition(selectedNodes[0]) ?? null;
    nodeConnecting.current = nodeConnectTargetPosition.current !== null;
  }, [network]);

  const onNodeEdit = useCallback(() => {
    if (!network || network.getSelectedNodes().length < 1) return;

    setRadialTarget(null);
    props.onEditNode(nodeLookup.get(network.getSelectedNodes()[0] as number)!);
  }, [network, nodeLookup, props]);

  const onNodeDelete = useCallback(() => {
    if (!network || network.getSelectedNodes().length < 1) return;

    setRadialTarget(null);
    topologyStore.manager.deleteNode(
      nodeLookup.get(network.getSelectedNodes()[0] as number)!
    );
  }, [network, nodeLookup, topologyStore]);

  const networkContextMenuItems = useMemo(() => {
    if (selectedNode !== null) {
      return [
        {
          label: 'Connect',
          icon: 'pi pi-arrow-right-arrow-left',
          command: onNodeConnect,
        },
        {label: 'Edit', icon: 'pi pi-pen-to-square', command: onNodeEdit},
        {label: 'Delete', icon: 'pi pi-trash', command: onNodeDelete},
      ];
    } else {
      return [
        {
          label: 'Add Node',
          icon: 'pi pi-plus',
          command: props.onAddNode,
        },
      ];
    }
  }, [selectedNode, onNodeConnect, onNodeDelete, onNodeEdit, props]);

  function onNetworkClick(selectData: NodeClickEvent) {
    if (!network) return;

    const targetNode = network?.getNodeAt(selectData.pointer.DOM);
    if (radialTarget === targetNode) return;

    if (targetNode !== undefined) {
      const targetPosition = network.getPosition(targetNode);

      /*
       * If a node is already selected, hide the menu first and then show it
       * with a delay.
       */
      if (selectedNode !== null) {
        radialMenuRef.current?.hide();
        setTimeout(() => {
          openRadialMenu(targetPosition);
        }, 230);
      } else {
        openRadialMenu(targetPosition);
      }
      setSelectedNode(targetNode as number);
      setRadialTarget(targetNode as number);
    } else {
      radialMenuRef.current?.hide();
      setSelectedNode(null);
      setRadialTarget(null);
      network.unselectAll();
    }
  }

  function openRadialMenu(position: Position) {
    if (!network || !radialMenuRef.current) return;

    const element = radialMenuRef.current?.getElement();
    element.style.top = `${network?.canvasToDOM(position).y - 32}px`;
    element.style.left = `${network?.canvasToDOM(position).x - 32}px`;
    radialMenuRef.current?.show();
  }

  function onNetworkDoubleClick(selectData: NodeClickEvent) {
    if (!nodeContextMenuRef.current) return;

    const targetNode = network?.getNodeAt(selectData.pointer.DOM);
    if (targetNode !== undefined) {
      network?.selectNodes([targetNode]);
      onNodeEdit();
    }
  }

  function onNetworkContext(selectData: NodeClickEvent) {
    if (!nodeContextMenuRef.current) return;

    const targetNode = network?.getNodeAt(selectData.pointer.DOM);
    if (targetNode !== undefined) {
      network?.selectNodes([targetNode]);
      setSelectedNode(targetNode as number);
    } else {
      setSelectedNode(null);
    }

    nodeContextMenuRef.current.show(selectData.event);
  }

  function onNetworkDragging() {
    radialMenuRef.current?.hide();
  }

  const radialItems = [
    {
      label: 'Connect',
      icon: 'pi pi-arrow-right-arrow-left',
      command: onNodeConnect,
    },
    {
      label: 'Edit',
      icon: 'pi pi-pen-to-square',
      command: onNodeEdit,
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: onNodeDelete,
    },
  ];

  return (
    <div
      className="w-full h-full sb-node-editor"
      ref={containerRef}
      onMouseMove={onMouseMove}
    >
      <SpeedDial
        className="sb-node-editor-dial"
        ref={radialMenuRef}
        model={radialItems}
        radius={80}
        type="circle"
        visible={true}
        hideOnClickOutside={false}
        buttonClassName="p-button-warning"
      />
      <Graph
        graph={{nodes: [], edges: []}}
        options={NetworkOptions}
        events={{
          click: onNetworkClick,
          oncontext: onNetworkContext,
          doubleClick: onNetworkDoubleClick,
          dragging: onNetworkDragging,
        }}
        getNetwork={setNetwork}
      />
      <ContextMenu model={networkContextMenuItems} ref={nodeContextMenuRef} />
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
export default NodeEditor;
