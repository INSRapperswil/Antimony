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

import {TopologyDefinition} from '@sb/types/Types';
import {YAMLDocument} from '@sb/lib/utils/YAMLDocument';
import {RootStoreContext} from '@sb/lib/stores/RootStore';

import './NodeEditor.sass';

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

  const deviceStore = useContext(RootStoreContext).deviceStore;
  const topologyStore = useContext(RootStoreContext).topologyStore;

  const nodeContextMenuRef = useRef<ContextMenu | null>(null);
  const containerRef = useRef(null);
  const radialMenuRef = useRef<SpeedDial>(null);

  // Connection state does not have to be reactive, so we define it as refs
  const nodeConnectTarget = useRef<Position | null>(null);
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
    network?.setData(graph);
    radialMenuRef.current?.hide();
    setSelectedNode(null);
  }, [network, graph]);

  const networkCanvasContext = useRef<CanvasRenderingContext2D | null>(null);

  const drawConnectionLine = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (
        !network ||
        !nodeConnectTarget.current ||
        !nodeConnectDestination.current
      ) {
        return;
      }

      const target = nodeConnectTarget.current;
      const destination = getMousePosition(
        ctx.canvas,
        nodeConnectDestination.current
      );

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(66 181 172)';
      ctx.moveTo(target.x, target.y);
      ctx.lineTo(destination.x, destination.y);
      ctx.stroke();
    },
    [network]
  );

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      networkCanvasContext.current = ctx;

      const width = window.outerWidth;
      const height = window.outerHeight;
      const gridSpacing = 30;
      const gridExtent = 4;

      // ctx.globalCompositeOperation = 'destination-over';
      ctx.strokeStyle = 'rgba(34, 51, 56, 1)';
      ctx.beginPath();

      for (
        let x = -width * gridExtent;
        x <= width * gridExtent;
        x += gridSpacing
      ) {
        ctx.beginPath();
        if (x % 4 === 0) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgb(41,61,67)';
        } else {
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgb(39,58,64)';
        }
        ctx.moveTo(x, height * gridExtent);
        ctx.lineTo(x, -height * gridExtent);
        ctx.stroke();
      }
      for (
        let y = -height * gridExtent;
        y <= height * gridExtent;
        y += gridSpacing
      ) {
        ctx.beginPath();
        if (y % 4 === 0) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgb(41,61,67)';
        } else {
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgb(39,58,64)';
        }
        ctx.moveTo(width * gridExtent, y);
        ctx.lineTo(-width * gridExtent, y);
        ctx.stroke();
      }

      drawConnectionLine(ctx);
    },
    [drawConnectionLine]
  );

  useEffect(() => {
    if (!network) return;
    network.on('beforeDrawing', drawGrid);

    return () => network.off('beforeDrawing', drawGrid);
  }, [network, drawGrid]);

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
    nodeConnectTarget.current =
      network?.getPosition(network?.getSelectedNodes()[0]) ?? null;
    nodeConnecting.current = nodeConnectTarget.current !== null;
  }, [network]);

  const onNodeEdit = useCallback(() => {
    if (!network || network.getSelectedNodes().length < 1) return;

    props.onEditNode(nodeLookup.get(network.getSelectedNodes()[0] as number)!);
  }, [network, nodeLookup, props]);

  const onNodeDelete = useCallback(() => {
    if (!network || network.getSelectedNodes().length < 1) return;

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
    } else {
      radialMenuRef.current?.hide();
      setSelectedNode(null);
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
