import NodeToolbar from '@sb/components/editor-page/topology-editor/node-editor/toolbar/node-toolbar';
import {MenuItem} from 'primereact/menuitem';
import {SpeedDial} from 'primereact/speeddial';
import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {IdType, Network} from 'vis-network';
import {DataSet} from 'vis-data/peer';
import Graph from 'react-graph-vis';
import {Node, Edge, Position} from 'vis';
import {Data} from 'vis-network/declarations/network/Network';
import {NetworkOptions} from './network.conf';
import {ContextMenu} from 'primereact/contextmenu';
import useResizeObserver from '@react-hook/resize-observer';

import {GraphNodeClickEvent, Topology} from '@sb/types/types';
import {useDeviceStore, useTopologyStore} from '@sb/lib/stores/root-store';

import './node-editor.sass';
import {drawGrid} from '@sb/lib/utils/utils';
import {isEqual} from 'lodash';

interface NodeEditorProps {
  openTopology: Topology | null;

  onEditNode: (nodeName: string) => void;
  onAddNode: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = (props: NodeEditorProps) => {
  const [network, setNetwork] = useState<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<IdType | null>(null);
  const [contextMenuModel, setContextMenuModel] = useState<MenuItem[] | null>(
    null
  );

  const deviceStore = useDeviceStore();
  const topologyStore = useTopologyStore();

  const containerRef = useRef(null);
  const contextMenuRef = useRef<ContextMenu | null>(null);
  const radialMenuRef = useRef<SpeedDial>(null);

  // Reference to the currently targeted node for the radial and context menu
  const menuTargetRef = useRef<IdType | null>(null);

  // Referece to the current graph data since we can't get it from the network
  const currentNetworkData = useRef<Data | null>(null);

  const nodeConnectTarget = useRef<IdType | null>(null);
  const nodeConnectTargetPosition = useRef<Position | null>(null);
  const nodeConnectDestination = useRef<Position | null>(null);
  const nodeConnecting = useRef(false);

  useResizeObserver(containerRef, () => {
    if (network) {
      network.redraw();
    }
  });

  // const nodeLookup: Map<IdType, string> = useMemo(() => {
  //   if (!props.openTopology) return new Map();
  //
  //   return new Map(
  //     Object.entries(props.openTopology.definition.toJS().topology.nodes)
  //       .entries()
  //       .map(([index, [nodeName]]) => [index, nodeName])
  //   );
  // }, [props.openTopology]);

  const graph: Data = useMemo(() => {
    if (!props.openTopology) {
      return {nodes: new DataSet(), edges: new DataSet()};
    }

    const nodes: DataSet<Node> = new DataSet();

    for (const [nodeName, node] of Object.entries(
      props.openTopology.definition.toJS().topology.nodes
    )) {
      nodes.add({
        id: nodeName,
        label: nodeName,
        image: deviceStore.getNodeIcon(node),
        x: props.openTopology.positions.get(nodeName)?.x,
        y: props.openTopology.positions.get(nodeName)?.y,
        fixed: {
          x: true,
          y: true,
        },
      });
    }

    const links = props.openTopology.definition.toJS().topology.links;
    if (!links) return {nodes, edges: new DataSet()};

    const edges: DataSet<Edge> = new DataSet([
      ...links.entries().map(([index, link]) => ({
        id: index,
        from: link.endpoints[0].split(':')[0],
        to: link.endpoints[1].split(':')[0],
      })),
    ]);

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
    const position = network.getViewPosition();
    const scale = network.getScale();
    setSelectedNode(null);
    radialMenuRef.current?.hide();
    network.setData(graph);
    network.moveTo({position, scale});
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
    if (!network || menuTargetRef.current === null) return;

    nodeConnectTarget.current = menuTargetRef.current;
    nodeConnectTargetPosition.current =
      network?.getPosition(menuTargetRef.current) ?? null;
    nodeConnecting.current = nodeConnectTargetPosition.current !== null;
  }, [network]);

  const onNodeEdit = useCallback(() => {
    if (!network || menuTargetRef.current === null) return;

    setSelectedNode(null);
    radialMenuRef.current?.hide();
    props.onEditNode(menuTargetRef.current as string);
  }, [network, props]);

  const onNodeDelete = useCallback(() => {
    if (!network || menuTargetRef.current === null) return;

    topologyStore.manager.deleteNode(menuTargetRef.current as string);
  }, [network, topologyStore.manager]);

  const nodeContextMenuModel = [
    {
      label: 'Connect',
      icon: 'pi pi-arrow-right-arrow-left',
      command: onNodeConnect,
    },
    {label: 'Edit', icon: 'pi pi-pen-to-square', command: onNodeEdit},
    {label: 'Delete', icon: 'pi pi-trash', command: onNodeDelete},
  ];

  const networkContextMenuModel = [
    {
      label: 'Add Node',
      icon: 'pi pi-plus',
      command: props.onAddNode,
    },
  ];

  function onNetworkClick(selectData: GraphNodeClickEvent) {
    if (!network) return;

    const targetNode = network?.getNodeAt(selectData.pointer.DOM);
    if (targetNode === selectedNode) {
      radialMenuRef.current?.hide();
      setSelectedNode(null);
      network.unselectAll();
      return;
    }

    if (targetNode !== undefined) {
      /*
       * If a node is already selected, hide the menu first and then show it
       * with a delay.
       */
      if (selectedNode !== null) {
        radialMenuRef.current?.hide();
        setTimeout(() => {
          openRadialMenu(targetNode);
        }, 200);
      } else {
        openRadialMenu(targetNode);
      }
      setSelectedNode(targetNode);
    } else {
      radialMenuRef.current?.hide();
      setSelectedNode(null);
      network.unselectAll();
    }
  }

  function openRadialMenu(targetNode: IdType) {
    if (!network || !radialMenuRef.current) return;

    menuTargetRef.current = targetNode;

    const targetPosition = network.getPosition(targetNode);
    const element = radialMenuRef.current?.getElement();

    element.style.top = `${network?.canvasToDOM(targetPosition).y - 32}px`;
    element.style.left = `${network?.canvasToDOM(targetPosition).x - 32}px`;
    radialMenuRef.current?.show();
  }

  function onNetworkDoubleClick(selectData: GraphNodeClickEvent) {
    if (!contextMenuRef.current) return;

    const targetNode = network?.getNodeAt(selectData.pointer.DOM);
    if (targetNode !== undefined) {
      network?.selectNodes([targetNode]);
      setSelectedNode(targetNode);
      radialMenuRef.current?.hide();
      onNodeEdit();
    }
  }

  function onNetworkContext(selectData: GraphNodeClickEvent) {
    if (!contextMenuRef.current) return;

    const targetNode = network?.getNodeAt(selectData.pointer.DOM);

    if (targetNode !== undefined) {
      setContextMenuModel(nodeContextMenuModel);
      menuTargetRef.current = targetNode;
    } else {
      setContextMenuModel(networkContextMenuModel);
      menuTargetRef.current = null;
    }

    contextMenuRef.current.show(selectData.event);
  }

  function onNetworkDragging() {
    radialMenuRef.current?.hide();
  }

  function onNodeDragStart(event: GraphNodeClickEvent) {
    if (!event || !network || !graph.nodes || event.nodes.length === 0) return;

    (graph.nodes as DataSet<Node>).update({
      id: event.nodes[0],
      fixed: {x: false, y: false},
    });
  }

  function onNodeMoved(event: GraphNodeClickEvent) {
    if (
      !network ||
      !topologyStore.manager.topology ||
      event.nodes.length === 0
    ) {
      return;
    }

    (graph.nodes as DataSet<Node>).update({
      id: event.nodes[0],
      fixed: {x: true, y: true},
    });

    topologyStore.manager.topology.positions.set(
      event.nodes[0] as string,
      network?.getPosition(event.nodes[0])
    );
  }

  function onNetworkStabilizeDone() {
    if (!graph || !network || !graph.nodes) return;

    setAllPositions();

    const nodes = graph.nodes as DataSet<Node>;
    nodes.forEach(node =>
      nodes.update({
        id: node.id,
        fixed: {x: true, y: true},
      })
    );
  }

  function setAllPositions() {
    if (!network) return;

    (graph.nodes as DataSet<Node>).forEach(node => {
      if (!node.id) return;

      topologyStore.manager.topology?.positions.set(
        node.id as string,
        network.getPosition(node.id)
      );
    });
  }

  function onAutoLayout() {
    if (!network) return;

    const nodes = graph.nodes as DataSet<Node>;
    nodes.forEach(node =>
      nodes.update({id: node.id, fixed: {x: false, y: false}})
    );

    network.startSimulation();
    setTimeout(() => {
      network.stopSimulation();
      nodes.forEach(node =>
        nodes.update({id: node.id, fixed: {x: true, y: true}})
      );
      setAllPositions();
    }, 800);
  }

  function onFitLayout() {
    if (!network) return;

    wrapInMoveAnimation(() => network.fit());
  }

  function wrapInMoveAnimation(callback: () => void) {
    if (!network) {
      callback();
      return;
    }

    const positionBefore = network.getViewPosition();
    const scaleBefore = network.getScale();

    callback();

    const positionAfter = network.getViewPosition();
    const scaleAfter = network.getScale();
    network.moveTo({position: positionBefore, scale: scaleBefore});

    network.moveTo({
      position: positionAfter,
      scale: scaleAfter,
      animation: {
        duration: 200,
        easingFunction: 'easeOutQuad',
      },
    });
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
      <NodeToolbar onAutoLayout={onAutoLayout} onFitLayout={onFitLayout} />
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
          dragStart: onNodeDragStart,
          dragEnd: onNodeMoved,
          stabilizationIterationsDone: onNetworkStabilizeDone,
        }}
        getNetwork={setNetwork}
      />
      <ContextMenu model={contextMenuModel ?? undefined} ref={contextMenuRef} />
    </div>
  );
};

export default NodeEditor;
