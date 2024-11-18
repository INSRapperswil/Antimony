import {APIStore} from '@sb/lib/stores/api-store';
import {TopologyStore} from '@sb/lib/stores/topology-store';
import {parsePosition} from '@sb/lib/utils/utils';
import _ from 'lodash';
import {parseDocument, Scalar, YAMLMap} from 'yaml';
import cloneDeep from 'lodash.clonedeep';

import {Binding} from '@sb/lib/utils/binding';
import {
  ErrorResponse,
  Position,
  Topology,
  TopologyDefinition,
  TopologyOut,
  YAMLDocument,
} from '@sb/types/types';

export type TopologyEditReport = {
  updatedTopology: Topology;

  // Whether the topology is different to the saved one
  isEdited: boolean;

  /*
   * This field makes it so components can identify if the update comes from
   * them or some other source and update accordingly.
   */
  source: TopologyEditSource;
};

export enum TopologyEditSource {
  NodeEditor,
  TextEditor,
  System,
}

export class TopologyManager {
  private apiStore: APIStore;
  private topologyStore: TopologyStore;
  private editingTopology: Topology | null = null;
  private originalTopology: Topology | null = null;

  public readonly onOpen: Binding<Topology> = new Binding();
  public readonly onClose: Binding<void> = new Binding();
  public readonly onEdit: Binding<TopologyEditReport> = new Binding();

  constructor(apiStore: APIStore, topologyStore: TopologyStore) {
    this.apiStore = apiStore;
    this.topologyStore = topologyStore;
    this.onEdit.register(
      updateReport => (this.editingTopology = updateReport.updatedTopology)
    );

    // Bind these functions to the class so they can be called from the view directly
    this.clear = this.clear.bind(this);
    this.save = this.save.bind(this);
  }

  public get editingTopologyId(): string | null {
    return this.editingTopology?.id ?? null;
  }

  /**
   * Submits the current topology to the API and resets the referenced saved
   * topology to the current topology if the upload was successful.
   */
  public async save(): Promise<ErrorResponse | null> {
    if (!this.editingTopology) return null;

    const error = await this.topologyStore.update(this.editingTopology);
    if (error) return error;

    await this.topologyStore.fetch();

    this.originalTopology = cloneDeep(this.editingTopology);
    this.onEdit.update({
      updatedTopology: this.editingTopology,
      isEdited: false,
      source: TopologyEditSource.System,
    });

    return null;
  }

  /**
   * Returns whether a topology is currently open.
   */
  public isOpen(): boolean {
    return this.editingTopology !== null;
  }

  /**
   * Opens a new topology to edit.
   *
   * @param topology The topology to edit.
   */
  public open(topology: Topology) {
    this.originalTopology = topology;
    this.editingTopology = cloneDeep(topology);

    this.onOpen.update(this.editingTopology);
  }

  /**
   * Closes the current topology.
   */
  public close() {
    this.editingTopology = null;
    this.originalTopology = null;

    this.onClose.update();
  }

  /**
   * Replaces the current topology with a one and notifies all subscribers.
   *
   * @param updatedTopology The updated topology.
   * @param source The source of the update.
   */
  public apply(
    updatedTopology: YAMLDocument<TopologyDefinition>,
    source: TopologyEditSource
  ) {
    if (!this.editingTopology) return;

    this.onEdit.update({
      updatedTopology: {
        ...this.editingTopology,
        definition: updatedTopology,
      },
      isEdited: !_.isEqual(
        updatedTopology.toString(),
        this.originalTopology?.definition.toString()
      ),
      source: source,
    });
  }

  /**
   * Removes all the nodes and links from the topology.
   */
  public clear() {
    if (!this.editingTopology) return;

    const updatedTopology = {
      name: this.editingTopology.definition.toJS().name,
      topology: {
        nodes: {},
        links: [],
      },
    };

    this.apply(
      new YAMLDocument(updatedTopology),
      TopologyEditSource.NodeEditor
    );
  }

  /**
   * Deletes a node from the topology.
   *
   * @param nodeName The name of the node to delete.
   */
  public deleteNode(nodeName: string) {
    if (!this.editingTopology) return;

    const updatedTopology = this.editingTopology.definition.clone();
    const wasDeleted = updatedTopology.deleteIn([
      'topology',
      'nodes',
      nodeName,
    ]);
    if (!wasDeleted) return;

    this.apply(updatedTopology, TopologyEditSource.NodeEditor);
  }

  /**
   * Connects two nodes in the topology.
   *
   * @param nodeName1 The name of the first node to connect.
   * @param nodeName2 The name of ths second node to connect.
   */
  public connectNodes(nodeName1: string, nodeName2: string) {
    if (!this.editingTopology) return;

    console.log('Connecting nodes: n1:', nodeName1, 'n2:', nodeName2);

    this.apply(this.editingTopology.definition, TopologyEditSource.NodeEditor);
  }

  /**
   * Adds a new node to the topology.
   *
   * @param kind The kind of the node to add.
   */
  public addNode(kind: string) {
    if (!this.editingTopology) return;

    console.log('Add node:', kind);

    this.apply(this.editingTopology.definition, TopologyEditSource.NodeEditor);
  }

  /**
   * Returns whether the currently open topology has been edited.
   */
  public hasEdits() {
    if (!this.editingTopology || !this.originalTopology) return false;
    return !_.isEqual(
      this.editingTopology.definition.toJS(),
      this.originalTopology.definition.toJS()
    );
  }

  public get topology() {
    return this.editingTopology;
  }

  public static parseTopologies(input: TopologyOut[]) {
    const topologies: Topology[] = [];
    for (const topology of input) {
      try {
        const definition = parseDocument((topology as TopologyOut).definition, {
          keepSourceTokens: true,
        });
        const positions = new Map<string, Position>();
        const nodes = definition.getIn(['topology', 'nodes']) as YAMLMap;
        if (nodes && nodes.items.length > 0) {
          /*
           * The comment of the first element is actually the comment of the
           * array itself for some reason.
           */
          if (nodes.commentBefore) {
            const parsed = parsePosition(nodes.commentBefore);
            if (parsed) {
              positions.set(
                (nodes.items[0].key as Scalar).value as string,
                parsed
              );
            }
          }
          for (let i = 1; i < nodes.items.length; i++) {
            // console.log('Node: ', nodes.items[i]);
            const key = nodes.items[i].key as Scalar;
            const parsed = parsePosition(key.commentBefore);
            if (parsed) {
              positions.set(key.value as string, parsed);
            }
          }
        }
        topologies.push({
          ...topology,
          definition: definition,
          positions: positions,
        });
      } catch (e) {
        console.error(
          '[NET] Failed to parse incoming topology: ',
          topology,
          ':',
          e
        );
      }
    }

    console.log('TOPOLOGIES:', topologies);

    return topologies.toSorted((a, b) =>
      (a.definition.get('name') as string).localeCompare(
        b.definition.get('name') as string
      )
    );
  }
}

export const DefaultTopology = `name: topology
topology:
  nodes:
    node1:`;
