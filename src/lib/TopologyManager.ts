import {ClabSchema, Topology, TopologyDefinition} from '@sb/types/Types';
import _, {clone} from 'lodash';
import {SBBinding} from '@sb/lib/SBBinding';
import cloneDeep from 'lodash.clonedeep';

export type TopologyEditReport = {
  updatedTopology: Topology;

  // Wether the topology is different to the saved one
  isEdited: boolean;
};

export class TopologyManager {
  private clabSchema: ClabSchema;

  private editingTopology: Topology | null = null;
  private originalTopology: Topology | null = null;

  public readonly onOpen: SBBinding<Topology> = new SBBinding();
  public readonly onEdit: SBBinding<TopologyEditReport> = new SBBinding();

  constructor(clabSchema: ClabSchema) {
    this.clabSchema = clabSchema;

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
  public edit(updatedTopology: TopologyDefinition) {
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

    this.edit(updatedTopology);
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

    this.edit(updatedTopology);
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

    this.edit(this.editingTopology.definition);
  }

  /**
   * Adds a new node to the topology.
   *
   * @param kind The kind of the node to add.
   */
  public addNode(kind: string) {
    if (!this.editingTopology) return;

    console.log('Add node', kind);

    this.edit(this.editingTopology.definition);
  }

  /**
   * Returns whether the currently open topology has been edited.
   */
  public hasEdits() {
    if (!this.editingTopology || !this.originalTopology) return false;
    return !_.isEqual(this.editingTopology, this.originalTopology);
  }
}

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | string[]
  | number[]
  | boolean[];
