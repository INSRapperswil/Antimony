import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {Node, Edge} from 'vis';
import {Network} from 'vis-network';
import Graph from 'react-graph-vis';

import {DeviceInfo, TopologyDefinition} from '@sb/types/Types';
import {NetworkOptions} from './network.conf';

import './NodeEditor.sass';
import {ContextMenu} from 'primereact/contextmenu';
import {MegaMenu} from 'primereact/megamenu';
import {NotificationController} from '@sb/lib/NotificationController';
import {IconMap} from '@sb/components/AdminPage/TopologyEditor/TopologyEditor';

interface NodeEditorProps {
  notificationController: NotificationController;

  openTopology: TopologyDefinition | null;
  deviceLookup: Map<string, DeviceInfo>;

  onNodeAdd: (kind: string) => void;
  onNodeEdit: (nodeName: string) => void;
  onNodeConnect: (nodeName1: string, nodeName2: string) => void;
  onNodeDelete: (nodeName: string) => void;
}

type GraphDefinition = {
  nodes?: Node[];
  edges?: Edge[];
};

const NodeEditor: React.FC<NodeEditorProps> = (props: NodeEditorProps) => {
  const [network, setNetwork] = useState<Network | null>(null);

  const nodeContextMenuRef = useRef<ContextMenu | null>(null);

  useEffect(() => {
    if (!network) return;
    network.on('beforeDrawing', drawGrid);

    return () => network.off('beforeDrawing', drawGrid);
  }, [network]);

  const nodeLookup: Map<number, string> = useMemo(() => {
    if (!props.openTopology) return new Map();

    return new Map(
      Object.entries(props.openTopology.topology.nodes)
        .entries()
        .map(([index, [nodeName]]) => [index, nodeName])
    );
  }, [props.openTopology]);

  const getNodeIcon = useCallback(
    (kind: string) => {
      let iconName: string;
      const deviceInfo = props.deviceLookup.get(kind);
      if (deviceInfo) {
        iconName = IconMap.get(deviceInfo?.type) ?? 'generic';
      } else {
        iconName = 'generic';
      }
      if (!iconName) iconName = 'generic';

      return '/assets/icons/' + iconName + '.svg';
    },
    [props.deviceLookup]
  );

  const graph: GraphDefinition = useMemo(() => {
    if (!props.openTopology) return {nodes: [], edges: []};

    const nodeMap = new Map<string, number>();
    const nodes: Node[] = [];

    for (const [index, [nodeName, node]] of Object.entries(
      props.openTopology.topology.nodes
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
      ...props.openTopology.topology.links.entries().map(([index, link]) => ({
        id: index,
        from: nodeMap.get(link.endpoints[0].split(':')[0]),
        to: nodeMap.get(link.endpoints[1].split(':')[0]),
      })),
    ];

    return {nodes: nodes, edges: edges};
  }, [props.openTopology, getNodeIcon]);

  /*
   * Passing this through the graph's prop directly was causing a weird error. We need to take the imperative way here.
   */
  useEffect(() => {
    network?.setData(graph);
  }, [network, graph]);

  function drawGrid(ctx: CanvasRenderingContext2D) {
    const width = ctx.canvas.clientWidth;
    const height = ctx.canvas.clientHeight;
    const gridSpacing = 30;
    const gridExtent = 4;
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
  }

  const nodeContextMenu = [
    {
      label: 'Connect',
      icon: 'pi pi-arrow-right-arrow-left',
      command: onNodeConnect,
    },
    {label: 'Edit', icon: 'pi pi-pen-to-square', command: onNodeEdit},
    {label: 'Delete', icon: 'pi pi-trash', command: onNodeDelete},
  ];

  function onNodeConnect() {}

  function onNodeEdit() {
    if (!network || network.getSelectedNodes().length < 1) return;

    props.onNodeEdit(nodeLookup.get(network.getSelectedNodes()[0] as number)!);
  }

  function onNodeDelete() {
    if (!network || network.getSelectedNodes().length < 1) return;

    props.onNodeDelete(
      nodeLookup.get(network.getSelectedNodes()[0] as number)!
    );
  }

  const headerMenu = [
    {
      label: 'Nodes',
      icon: 'pi pi-plus',
      items: [
        [
          {
            label: 'Router',
            items: [
              {label: 'Accessories'},
              {label: 'Armchair'},
              {label: 'Coffee Table'},
              {label: 'Couch'},
              {label: 'TV Stand'},
            ],
          },
        ],
        [
          {
            label: 'Switch',
            items: [{label: 'Bar stool'}, {label: 'Chair'}, {label: 'Table'}],
          },
        ],
        [
          {
            label: 'Container',
            items: [
              {label: 'Bed'},
              {label: 'Chaise lounge'},
              {label: 'Cupboard'},
              {label: 'Dresser'},
              {label: 'Wardrobe'},
            ],
          },
        ],
        [
          {
            label: 'Virtual Machine',
            items: [
              {label: 'Bookcase'},
              {label: 'Cabinet'},
              {label: 'Chair'},
              {label: 'Desk'},
              {label: 'Executive Chair'},
            ],
          },
        ],
        [
          {
            label: 'Container',
            items: [
              {label: 'Bookcase'},
              {label: 'Cabinet'},
              {label: 'Chair'},
              {label: 'Desk'},
              {label: 'Executive Chair'},
            ],
          },
        ],
        [
          {
            label: 'Generic',
            items: [
              {label: 'Bookcase'},
              {label: 'Cabinet'},
              {label: 'Chair'},
              {label: 'Desk'},
              {label: 'Executive Chair'},
            ],
          },
        ],
      ],
    },
  ];

  function onNodeClick(selectData: NodeClickEvent) {
    console.log('Selected: ', selectData);
  }

  function onNodeDoubleClick(selectData: NodeClickEvent) {
    if (!nodeContextMenuRef.current) return;

    const targetNode = network?.getNodeAt(selectData.pointer.DOM);
    if (targetNode !== undefined) {
      network?.selectNodes([targetNode]);
      onNodeEdit();
    }
  }

  function onNodeContext(selectData: NodeClickEvent) {
    if (!nodeContextMenuRef.current) return;

    const targetNode = network?.getNodeAt(selectData.pointer.DOM);
    if (targetNode !== undefined) {
      network?.selectNodes([targetNode]);
      nodeContextMenuRef.current.show(selectData.event);
    }
  }

  return (
    <div className="w-full h-full">
      <MegaMenu model={headerMenu} />
      <Graph
        graph={{nodes: [], edges: []}}
        options={NetworkOptions}
        events={{
          click: onNodeClick,
          oncontext: onNodeContext,
          doubleClick: onNodeDoubleClick,
        }}
        getNetwork={setNetwork}
      />
      <ContextMenu model={nodeContextMenu} ref={nodeContextMenuRef} />
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
