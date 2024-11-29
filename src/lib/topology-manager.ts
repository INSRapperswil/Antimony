import {APIStore} from '@sb/lib/stores/api-store';
import {TopologyStore} from '@sb/lib/stores/topology-store';
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
    this.writePositions = this.writePositions.bind(this);
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
   * @param updatedPositions (Optional) The updated positions map.
   */
  public apply(
    updatedTopology: YAMLDocument<TopologyDefinition>,
    source: TopologyEditSource,
    updatedPositions: Map<string, Position> | undefined = undefined
  ) {
    if (!this.editingTopology) return;

    this.onEdit.update({
      updatedTopology: {
        ...this.editingTopology,
        positions: updatedPositions ?? this.editingTopology.positions,
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
      this.editingTopology.definition.toString(),
      this.originalTopology.definition.toString()
    );
  }

  /**
   * Writes the positions from the position map to the topology definition.
   */
  public writePositions() {
    if (!this.editingTopology) return;

    const yamlNodes = this.editingTopology.definition.getIn([
      'topology',
      'nodes',
    ]) as YAMLMap;

    const nodeKeys = Object.keys(
      yamlNodes.toJS(this.editingTopology.definition)
    );
    if (nodeKeys.length === 0) return;

    /*
     * We need to write the first comment differently as it belongs to the node
     * list and not to the actual node.
     */
    if (this.editingTopology.positions.has(nodeKeys[0])) {
      yamlNodes.commentBefore = TopologyManager.writePosition(
        this.editingTopology.positions.get(nodeKeys[0])!
      );
    }

    for (let i = 1; i < yamlNodes.items.length; i++) {
      if (!this.editingTopology.positions.has(nodeKeys[i])) continue;

      const key = yamlNodes.items[i].key as Scalar;
      key.commentBefore = TopologyManager.writePosition(
        this.editingTopology.positions.get(nodeKeys[i])!
      );
    }

    this.apply(this.editingTopology.definition, TopologyEditSource.System);
  }

  public get topology() {
    return this.editingTopology;
  }

  public static parseTopology(
    definitionString: string
  ): [YAMLDocument<TopologyDefinition>, Map<string, Position>] {
    const definition = parseDocument(definitionString, {
      keepSourceTokens: true,
    });
    const positions = new Map<string, Position>();
    const nodes = definition.getIn(['topology', 'nodes']) as YAMLMap;
    if (!nodes) {
      definition.setIn(['topology', 'nodes'], {});
    } else if (nodes.items.length > 0) {
      /*
       * We need to parse the first comment differently as it belongs to the
       * node list and not to the actual node.
       */
      if (nodes.commentBefore) {
        const parsed = TopologyManager.readPosition(nodes.commentBefore);
        if (parsed) {
          positions.set((nodes.items[0].key as Scalar).value as string, parsed);
        }
      }
      for (let i = 1; i < nodes.items.length; i++) {
        const key = nodes.items[i].key as Scalar;
        const parsed = TopologyManager.readPosition(key.commentBefore);
        if (parsed) {
          positions.set(key.value as string, parsed);
        }
      }
    }

    return [definition, positions];
  }

  public static parseTopologies(input: TopologyOut[]) {
    const topologies: Topology[] = [];
    for (const topology of input) {
      try {
        const [definition, positions] = TopologyManager.parseTopology(
          topology.definition
        );

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

    return topologies.toSorted((a, b) =>
      (a.definition.get('name') as string)?.localeCompare(
        b.definition.get('name') as string
      )
    );
  }

  /**
   * Parses a position string to a position object. Returns null if the parsing
   * failed.
   *
   * Format: pos=[x, y]
   */
  private static readPosition(
    value: string | null | undefined
  ): Position | null {
    if (!value) return null;

    const matches = value.replaceAll(' ', '').match(/pos=\[(-?\d+),(-?\d+)]/);
    if (matches && matches.length === 3) {
      const x = Number(matches[1]);
      const y = Number(matches[2]);
      if (!isNaN(x) && !isNaN(y)) {
        return {x, y};
      }
    }

    return null;
  }

  /**
   * Creates a position string from a position object.
   *
   * Format: pos=[x, y]
   */
  private static writePosition(position: Position) {
    return ' pos=[' + position.x + ',' + position.y + ']';
  }
}
