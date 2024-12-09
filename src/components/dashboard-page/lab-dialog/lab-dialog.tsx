import LabDialogPanel from '@sb/components/dashboard-page/lab-dialog/lab-dialog-panel/lab-dialog-panel';
import {
  useDeviceStore,
  useLabStore,
  useTopologyStore,
} from '@sb/lib/stores/root-store';
import classNames from 'classnames';
import React, {useEffect, useMemo, useRef, useState} from 'react';

import {DataSet} from 'vis-data/peer';
import {IdType, Network} from 'vis-network';
import Graph from 'react-graph-vis';
import {Button} from 'primereact/button';
import useResizeObserver from '@react-hook/resize-observer';

import {Lab, GraphNodeClickEvent} from '@sb/types/types';
import {NetworkOptions} from '@sb/components/editor-page/topology-editor/node-editor/network.conf';

import './lab-dialog.sass';
import {ContextMenu} from 'primereact/contextmenu';
import {drawGrid, generateGraph} from '@sb/lib/utils/utils';
import SBDialog from '@sb/components/common/sb-dialog/sb-dialog';
import {Data} from 'vis-network/declarations/network/Network';

interface LabDialogProps {
  lab: Lab;
  groupName: String;
  closeDialog: () => void;
}

const LabDialog: React.FC<LabDialogProps> = (props: LabDialogProps) => {
  const [network, setNetwork] = useState<Network | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hostsHidden, setHostsHidden] = useState(false);
  const nodeContextMenuRef = useRef<ContextMenu | null>(null);
  const [selectedNode, setSelectedNode] = useState<IdType | null>(null);
  const [isMenuVisible, setMenuVisible] = useState(false);

  const labStore = useLabStore();
  const deviceStore = useDeviceStore();
  const topologyStore = useTopologyStore();

  useResizeObserver(containerRef, () => {
    console.log('RESIZE OBSERVER TRIGGER');
    if (network) network.redraw();
  });

  const openTopology = useMemo(() => {
    return topologyStore.lookup.get(props.lab.topologyId);
  }, [props.lab.topologyId, topologyStore.lookup]);

  const graphData: Data = useMemo(() => {
    if (!openTopology) {
      return {nodes: new DataSet(), edges: new DataSet()};
    }

    return generateGraph(openTopology, deviceStore, topologyStore.manager);
  }, [deviceStore, openTopology, topologyStore.manager]);

  function onContext(event: GraphNodeClickEvent) {
    if (!nodeContextMenuRef.current) return;

    const targetNode = network?.getNodeAt(event.pointer.DOM);
    if (targetNode !== undefined) {
      network?.selectNodes([targetNode]);
      setSelectedNode(targetNode as number);
      nodeContextMenuRef.current.show(event.event);
    }

    event.event.preventDefault();
  }

  function onClick(selectData: GraphNodeClickEvent) {
    if (!network) return;

    const targetNode = network?.getNodeAt(selectData.pointer.DOM);

    if (targetNode !== undefined) {
      setSelectedNode(targetNode as number);
      setMenuVisible(true);
    } else {
      setMenuVisible(false);
    }
  }

  function onCopyActiveNode() {
    const nodeMeta = labStore.metaLookup
      .get(props.lab.id)!
      .get(selectedNode as string);

    if (nodeMeta) {
      const textToCopy = nodeMeta.webSsh + ':' + nodeMeta.port;

      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          console.log('Copied to clipboard:', textToCopy);
        })
        .catch(err => {
          console.error('Failed to copy to clipboard:', err);
        });
    }
  }

  function onOpenActiveNode() {
    const nodeMeta = labStore.metaLookup
      .get(props.lab.id)!
      .get(selectedNode as string);

    if (nodeMeta) window.open(nodeMeta.webSsh);
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
    if (network) {
      network.setData(graphData);
    }
  }, [network, graphData]);

  return (
    <>
      <SBDialog
        isOpen={props.lab !== null}
        onClose={props.closeDialog}
        headerTitle={
          <>
            <span>{props.groupName + ' / '}</span>
            <span className="sb-lab-dialog-title-name">{props.lab.name}</span>
          </>
        }
        hideButtons={true}
        className="sb-lab-dialog"
      >
        <div className="topology-graph-container" ref={containerRef}>
          <LabDialogPanel
            lab={props.lab}
            hostsHidden={hostsHidden}
            setHostsHidden={setHostsHidden}
          />
          <Graph
            graph={{nodes: [], edges: []}}
            options={{
              ...NetworkOptions,
              interaction: {
                dragNodes: false,
                dragView: false,
                zoomView: false,
              },
            }}
            events={{
              oncontext: onContext,
              click: onClick,
            }}
            getNetwork={setNetwork}
          />
        </div>
        <div
          className={classNames('sb-lab-dialog-footer sb-animated-overlay', {
            visible: isMenuVisible && selectedNode !== null,
          })}
        >
          <span className="sb-lab-dialog-footer-name">{selectedNode}</span>
          <Button
            label="Copy Host"
            icon="pi pi-copy"
            outlined
            onClick={onCopyActiveNode}
          />
          <Button
            label="Web SSH"
            icon="pi pi-external-link"
            outlined
            onClick={onOpenActiveNode}
          />
        </div>
      </SBDialog>
      <ContextMenu model={networkContextMenuItems} ref={nodeContextMenuRef} />
    </>
  );
};

export default LabDialog;
