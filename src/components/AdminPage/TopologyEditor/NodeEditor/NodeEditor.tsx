import React, {useEffect, useRef, useState} from 'react';
import {preload} from 'react-dom';

import {Node, Edge} from 'vis';
import {Network} from 'vis-network';
import Graph from 'react-graph-vis';

import {DeviceInfo, TopologyDefinition} from '@sb/types/Types';
import {NetworkOptions} from './network.conf';

import './NodeEditor.sass';
import {ContextMenu} from 'primereact/contextmenu';
import {MegaMenu} from 'primereact/megamenu';
import {NotificationController} from '@sb/lib/NotificationController';

interface NodeEditorProps {
  notificationController: NotificationController;

  openTopology: TopologyDefinition | null;
  devices: DeviceInfo[];

  onNodeAdd: (kind: string) => void;
  onNodeEdit: (nodeName: string) => void;
  onNodeConnect: (nodeName1: string, nodeName2: string) => void;
  onNodeDelete: (nodeName: string) => void;
}

const NodeEditor: React.FC<NodeEditorProps> = (props: NodeEditorProps) => {
  const [network, setNetwork] = useState<Network | null>(null);
  const [deviceInfoMap, setDeviceInfoMap] = useState<Map<string, DeviceInfo>>(
    new Map()
  );
  const [nodeLookup, setNodeLookup] = useState<Map<number, string>>(new Map());

  const nodeContextMenuRef = useRef<ContextMenu | null>(null);

  useEffect(() => {
    setDeviceInfoMap(
      new Map(props.devices.map(device => [device.kind, device]))
    );
  }, [props.devices]);

  useEffect(() => {
    if (!network) return;
    network.on('beforeDrawing', drawGrid);
  }, [network]);

  useEffect(generateGraph, [props.openTopology]);

  preload('./icons/generic.svg', {as: 'image'});
  preload('./icons/virtualserver.svg', {as: 'image'});
  preload('./icons/router.svg', {as: 'image'});
  preload('./icons/switch.svg', {as: 'image'});

  function generateGraph() {
    if (!props.openTopology) return;

    const nodeMap = new Map<string, number>();
    const nodeLookup = new Map<number, string>();

    const nodes: Node[] = [];
    const edges: Edge[] = [];

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

      nodeLookup.set(index, nodeName);
    }

    for (const [index, link] of props.openTopology.topology.links.entries()) {
      edges.push({
        id: index,
        from: nodeMap.get(link.endpoints[0].split(':')[0]),
        to: nodeMap.get(link.endpoints[1].split(':')[0]),
      });
    }

    setNodeLookup(nodeLookup);
    network?.setData({nodes: nodes, edges: edges});

    console.log('GENERATE GRAPH');
  }

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

  function getNodeIcon(kind: string) {
    let iconName: string;
    const deviceInfo = deviceInfoMap.get(kind);
    if (deviceInfo) {
      iconName = IconMap.get(deviceInfo?.type) ?? 'generic';
    } else {
      iconName = 'generic';
    }
    if (!iconName) iconName = 'generic';

    return './icons/' + iconName + '.svg';
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

const IconMap = new Map([
  ['VM', 'virtualserver'],
  ['Generic', 'generic'],
  ['Router', 'router'],
  ['Switch', 'switch'],
  ['Container', 'computer'],
]);
export default NodeEditor;
