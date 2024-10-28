import YAML from 'yaml';
import _, {clone} from 'lodash';
import cloneDeep from 'lodash.clonedeep';

import {Binding} from '@sb/lib/Utils/Binding';
import {Topology, TopologyDefinition, TopologyOut} from '@sb/types/Types';

export type TopologyEditReport = {
  updatedTopology: Topology;

  // Whether the topology is different to the saved one
  isEdited: boolean;
};

export class TopologyManager {
  private editingTopology: Topology | null = null;
  private originalTopology: Topology | null = null;

  public readonly onOpen: Binding<Topology> = new Binding();
  public readonly onEdit: Binding<TopologyEditReport> = new Binding();

  constructor() {
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
   * Resets the referenced saved topology to the current topology.
   */
  public save() {
    if (!this.editingTopology) return;

    this.originalTopology = cloneDeep(this.editingTopology);
    this.onEdit.update({
      updatedTopology: this.editingTopology,
      isEdited: false,
    });
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
  }

  /**
   * Replaces the current topology with a one and notifies all subscribers.
   *
   * @param updatedTopology The updated topology.
   */
  public apply(updatedTopology: TopologyDefinition) {
    if (!this.editingTopology) return;

    this.onEdit.update({
      updatedTopology: {
        ...this.editingTopology,
        definition: updatedTopology,
      },
      isEdited: !_.isEqual(updatedTopology, this.originalTopology?.definition),
    });
  }

  /**
   * Removes all the nodes and links from the topology.
   */
  public clear() {
    if (!this.editingTopology) return;

    const updatedTopology = {
      name: this.editingTopology.definition.name,
      topology: {
        nodes: {},
        links: [],
      },
    };

    this.apply(updatedTopology);
  }

  /**
   * Deletes a node from the topology.
   *
   * @param nodeName The name of the node to delete.
   */
  public deleteNode(nodeName: string) {
    if (!this.editingTopology?.definition.topology.nodes[nodeName]) return;

    const updatedTopology = clone(this.editingTopology?.definition);

    delete updatedTopology?.topology.nodes[nodeName];

    this.apply(updatedTopology);
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

    this.apply(this.editingTopology.definition);
  }

  /**
   * Adds a new node to the topology.
   *
   * @param kind The kind of the node to add.
   */
  public addNode(kind: string) {
    if (!this.editingTopology) return;

    console.log('Add node:', kind);

    this.apply(this.editingTopology.definition);
  }

  /**
   * Returns whether the currently open topology has been edited.
   */
  public hasEdits() {
    if (!this.editingTopology || !this.originalTopology) return false;
    return !_.isEqual(this.editingTopology, this.originalTopology);
  }

  public static parseTopologies(input: TopologyOut[]) {
    const topologies: Topology[] = [];
    for (const topology of input) {
      try {
        topologies.push({
          ...topology,
          definition: YAML.parse((topology as TopologyOut).definition),
        });
      } catch (e) {
        console.error('[NET] Failed to parse incoming topology: ', topology);
      }
    }

    return topologies;
  }
}
