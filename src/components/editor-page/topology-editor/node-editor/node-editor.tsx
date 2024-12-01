import SimulationPanel from '@sb/components/editor-page/topology-editor/node-editor/simulation-panel/simulation-panel';
import {useSimulationConfig} from '@sb/components/editor-page/topology-editor/node-editor/state/simulation-config';

import NodeToolbar from '@sb/components/editor-page/topology-editor/node-editor/toolbar/node-toolbar';
import {observer} from 'mobx-react-lite';
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

interface NodeEditorProps {
  openTopology: Topology | null;

  onEditNode: (nodeName: string) => void;
  onAddNode: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = observer(
  (props: NodeEditorProps) => {
    const [network, setNetwork] = useState<Network | null>(null);
    const [selectedNode, setSelectedNode] = useState<IdType | null>(null);
    const [contextMenuModel, setContextMenuModel] = useState<MenuItem[] | null>(
      null
    );

    const deviceStore = useDeviceStore();
    const topologyStore = useTopologyStore();
    const simulationConfig = useSimulationConfig();

    const containerRef = useRef(null);
    const contextMenuRef = useRef<ContextMenu | null>(null);
    const radialMenuRef = useRef<SpeedDial>(null);
    const networkCanvasContext = useRef<CanvasRenderingContext2D | null>(null);

    // Reference to the currently targeted node for the radial and context menu
    const menuTargetRef = useRef<IdType | null>(null);

    const nodeConnectTarget = useRef<IdType | null>(null);
    const nodeConnectTargetPosition = useRef<Position | null>(null);
    const nodeConnectDestination = useRef<Position | null>(null);

    useResizeObserver(containerRef, () => {
      if (network) {
        network.redraw();
      }
    });

    const graphData: Data = useMemo(() => {
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

      /*
       * We can safely assume that the endpoint strings are in the correct
       * format here since this is enforced by the schema and the node editor
       * only receives valid definitions get pushed to the node editor.
       */
      const edges: DataSet<Edge> = new DataSet([
        ...links.entries().map(([index, link]) => ({
          id: index,
          from: link.endpoints[0].split(':')[0],
          to: link.endpoints[1].split(':')[0],
        })),
      ]);

      return {nodes: nodes, edges: edges};
    }, [props.openTopology, deviceStore]);

    const onKeyDown = useCallback(
      (event: KeyboardEvent) => {
        console.log('ONKEYDOWN', event.key);
        if (event.key === 'Escape') {
          console.log('DISABLE');
          nodeConnectTarget.current = null;
          nodeConnectDestination.current = null;
          network?.redraw();
        }
      },
      [network]
    );

    const drawConnectionLine = useCallback(
      (ctx: CanvasRenderingContext2D) => {
        if (
          !network ||
          !nodeConnectTargetPosition.current ||
          !nodeConnectDestination.current ||
          !containerRef.current
        ) {
          return;
        }

        const target = nodeConnectTargetPosition.current;
        const canvasPosition = (
          containerRef.current as HTMLElement
        ).getBoundingClientRect();
        const relativeDestination = network.DOMtoCanvas(
          nodeConnectDestination.current
        );
        const destination = {
          x: relativeDestination.x - canvasPosition.x,
          y: relativeDestination.y - canvasPosition.y,
        };

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(66 181 172)';
        ctx.moveTo(target.x, target.y);
        ctx.lineTo(destination.x, destination.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(destination.x, destination.y, 4, 0, 2 * Math.PI);
        ctx.fill();
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

    const onNodeConnect = useCallback(() => {
      if (!network || menuTargetRef.current === null) return;

      nodeConnectTarget.current = menuTargetRef.current;
      nodeConnectTargetPosition.current =
        network?.getPosition(menuTargetRef.current) ?? null;
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

    const setNodesFixed = useCallback(
      (isFixed: boolean) => {
        const nodes = graphData.nodes as DataSet<Node>;
        nodes.forEach(node =>
          nodes.update({
            id: node.id,
            fixed: {x: isFixed, y: isFixed},
          })
        );
      },
      [graphData.nodes]
    );

    function onMouseMove(event: MouseEvent<HTMLDivElement>) {
      if (!nodeConnectTarget.current || !network) return;

      console.log('<BVE>');

      nodeConnectDestination.current = {x: event.clientX, y: event.clientY};
      network?.redraw();
    }

    useEffect(() => {
      if (!network) return;

      const position = network.getViewPosition();
      const scale = network.getScale();
      setSelectedNode(null);
      radialMenuRef.current?.hide();
      network.setData(graphData);
      network.moveTo({position, scale});
    }, [network, graphData]);

    useEffect(() => {
      window.addEventListener('keydown', onKeyDown);

      return () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [onKeyDown]);

    useEffect(() => {
      if (!network) return;
      network.on('beforeDrawing', onBeforeDrawing);

      return () => network.off('beforeDrawing', onBeforeDrawing);
    }, [network, onBeforeDrawing]);

    useEffect(() => {
      if (!network || !simulationConfig.liveSimulation) return;

      network.setOptions({
        ...NetworkOptions,
        ...simulationConfig.config,
      });
    }, [network, simulationConfig.config, simulationConfig.liveSimulation]);

    useEffect(() => {
      if (!network) return;

      setNodesFixed(!simulationConfig.liveSimulation);
    }, [network, setNodesFixed, simulationConfig.liveSimulation]);

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
      if (!event || !network || !graphData.nodes || event.nodes.length === 0)
        return;

      (graphData.nodes as DataSet<Node>).update({
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

      if (!simulationConfig.liveSimulation) {
        (graphData.nodes as DataSet<Node>).update({
          id: event.nodes[0],
          fixed: {
            x: true,
            y: true,
          },
        });
      }
    }

    function onStabilizeGraph() {
      if (!network) return;

      network.setOptions({
        ...NetworkOptions,
        ...simulationConfig.config,
        interaction: {
          dragNodes: false,
        },
      });

      const nodes = graphData.nodes as DataSet<Node>;
      nodes.forEach(node =>
        nodes.update({id: node.id, fixed: {x: false, y: false}})
      );

      simulationConfig.setStabilizing(true);

      setTimeout(() => {
        nodes.forEach(node =>
          nodes.update({
            id: node.id,
            fixed: {
              x: !simulationConfig.liveSimulation,
              y: !simulationConfig.liveSimulation,
            },
          })
        );
        simulationConfig.setStabilizing(false);
        network.setOptions({
          interaction: {
            dragNodes: true,
          },
        });
      }, 800);
    }

    function onFitGraph() {
      if (!network) return;

      withSmoothTrasition(() => network.fit());
    }

    function onSaveGraph() {
      if (!network) return;

      (graphData.nodes as DataSet<Node>).forEach(node => {
        if (!node.id) return;

        topologyStore.manager.topology?.positions.set(
          node.id as string,
          network.getPosition(node.id)
        );
      });

      topologyStore.manager.writePositions();
    }

    /**
     * Wraps a network modifying function into a smooth move transition.
     *
     * @param callback The function that is called which modifies the network
     */
    function withSmoothTrasition(callback: () => void) {
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

    const nodeRadialMenuModel = [
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
        className="sb-node-editor"
        ref={containerRef}
        onMouseMove={onMouseMove}
      >
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
          }}
          getNetwork={setNetwork}
        />
        <NodeToolbar
          onFitGraph={onFitGraph}
          onSaveGraph={onSaveGraph}
          onToggleStabilization={simulationConfig.togglePanel}
        />
        <SimulationPanel onStabilizeGraph={onStabilizeGraph} />
        <SpeedDial
          className="sb-node-editor-dial"
          ref={radialMenuRef}
          model={nodeRadialMenuModel}
          radius={80}
          type="circle"
          visible={true}
          hideOnClickOutside={false}
          buttonClassName="p-button-warning"
        />
        <ContextMenu
          model={contextMenuModel ?? undefined}
          ref={contextMenuRef}
        />
      </div>
    );
  }
);

export default NodeEditor;
