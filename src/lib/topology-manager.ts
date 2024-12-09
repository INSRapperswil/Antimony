import {APIStore} from '@sb/lib/stores/api-store';
import _ from 'lodash';
import {parseDocument, Scalar, YAMLMap, YAMLSeq} from 'yaml';
import cloneDeep from 'lodash.clonedeep';

import {Binding} from '@sb/lib/utils/binding';
import {
  ClabSchema,
  ErrorResponse,
  NodeConnection,
  Position,
  Topology,
  TopologyDefinition,
  TopologyOut,
  uuid4,
  YAMLDocument,
} from '@sb/types/types';
import {validate} from 'jsonschema';
import {DeviceStore} from '@sb/lib/stores/device-store';
import {pushOrCreateList} from '@sb/lib/utils/utils';
import {TopologyStore} from '@sb/lib/stores/topology-store';

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
  private deviceStore: DeviceStore;
  private topologyStore: TopologyStore;
  private editingTopology: Topology | null = null;
  private originalTopology: Topology | null = null;

  public readonly onOpen: Binding<Topology> = new Binding();
  public readonly onClose: Binding<void> = new Binding();
  public readonly onEdit: Binding<TopologyEditReport> = new Binding();

  constructor(
    apiStore: APIStore,
    topologyStore: TopologyStore,
    deviceStore: DeviceStore
  ) {
    this.apiStore = apiStore;
    this.deviceStore = deviceStore;
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

    const error = await this.topologyStore.update(this.editingTopology.id, {
      groupId: this.editingTopology.groupId,
      definition: this.editingTopology.definition.toString(),
    });
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

    const topologyMeta = this.buildTopologyMetadata(updatedTopology);

    this.onEdit.update({
      updatedTopology: {
        ...this.editingTopology,
        definition: updatedTopology,
        ...topologyMeta,
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
    if (!this.editingTopology || !this.deviceStore.data) return;

    const updatedTopology = this.editingTopology.definition.clone();
    const hostInterface = this.getNextInterface(nodeName1);
    const targetInterface = this.getNextInterface(nodeName2);
    const links = updatedTopology.getIn(['topology', 'links']) as YAMLSeq;
    links.add({
      endpoints: [
        `${nodeName1}:${hostInterface}`,
        `${nodeName2}:${targetInterface}`,
      ],
    });

    this.apply(updatedTopology, TopologyEditSource.NodeEditor);
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

  public getNodeTooltip(nodeName: string) {
    if (!this.editingTopology) return;

    // const node = (
    //   this.editingTopology.definition.getIn([
    //     'topology',
    //     'nodes',
    //     nodeName,
    //   ]) as YAMLMap
    // ).toJS(this.editingTopology.definition);
    return nodeName;
  }

  public getEdgeTooltip(connection: NodeConnection) {
    return `${connection.hostNode}:${connection.hostInterface} <···> ${connection.targetNode}:${connection.targetInterface}`;
  }

  /**
   * Returns all connections of a node.
   */
  private getNodeConnections(nodeName: string) {
    if (!this.editingTopology) return [];
    this.editingTopology?.connections.filter(
      connection =>
        connection.hostNode === nodeName || connection.targetNode === nodeName
    );
  }

  public static parseTopology(
    definitionString: string,
    schema: ClabSchema
  ): YAMLDocument<TopologyDefinition> | null {
    const definition = parseDocument(definitionString, {
      keepSourceTokens: true,
    });
    if (
      definition.errors.length > 0 &&
      validate(definition.toJS(), schema).errors.length > 0
    ) {
      return null;
    }

    return definition;
  }

  public buildTopologyMetadata(topology: YAMLDocument<TopologyDefinition>) {
    const positions = new Map<string, Position>();
    const nodes = topology.getIn(['topology', 'nodes']) as YAMLMap;
    if (!nodes) {
      topology.setIn(['topology', 'nodes'], {});
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

    if (!topology.hasIn(['topology', 'links'])) {
      return {
        positions,
        connections: [],
        connectionMap: new Map<string, NodeConnection[]>(),
      };
    }

    const links = (topology.getIn(['topology', 'links']) as YAMLSeq).toJS(
      topology
    );

    let index = 0;
    const connections: NodeConnection[] = [];
    const connectionMap = new Map<string, NodeConnection[]>();

    for (const link of links) {
      const [hostNode, hostInterface] = link.endpoints[0].split(':');
      const [targetNode, targetInterface] = link.endpoints[1].split(':');

      const hostNodeKind = this.editingTopology?.definition.getIn([
        'topology',
        'nodes',
        hostNode,
        'kind',
      ]) as string;

      const targetNodeKind = this.editingTopology?.definition.getIn([
        'topology',
        'nodes',
        targetNode,
        'kind',
      ]) as string;

      const hostInterfaceConfig =
        this.deviceStore.getInterfaceConfig(hostNodeKind);
      const targetInterfaceConfig =
        this.deviceStore.getInterfaceConfig(targetNodeKind);

      const hostInterfaceIndex = this.parseInterface(
        hostInterface,
        hostInterfaceConfig.interfacePattern
      );
      const targetInterfaceIndex = this.parseInterface(
        targetInterface,
        targetInterfaceConfig.interfacePattern
      );

      connections.push({
        index,
        hostNode,
        hostInterface,
        hostInterfaceIndex,
        hostInterfaceConfig,
        targetNode,
        targetInterface,
        targetInterfaceIndex,
        targetInterfaceConfig,
      });

      pushOrCreateList(connectionMap, hostNode, {
        index: index,
        hostNode: hostNode,
        hostInterface: hostInterface,
        hostInterfaceIndex: hostInterfaceIndex,
        hostInterfaceConfig: hostInterfaceConfig,
        targetNode: targetNode,
        targetInterface: targetInterface,
        targetInterfaceIndex: targetInterfaceIndex,
        targetInterfaceConfig: targetInterfaceConfig,
      });

      pushOrCreateList(connectionMap, targetNode, {
        index: index,
        hostNode: targetNode,
        hostInterface: targetInterface,
        hostInterfaceIndex: targetInterfaceIndex,
        hostInterfaceConfig: targetInterfaceConfig,
        targetNode: hostNode,
        targetInterface: hostInterface,
        targetInterfaceIndex: hostInterfaceIndex,
        targetInterfaceConfig: hostInterfaceConfig,
      });

      index++;
    }

    return {positions, connections, connectionMap};
  }

  public parseTopologies(input: TopologyOut[], schema: ClabSchema) {
    const topologies: Topology[] = [];
    for (const topology of input) {
      const definition = TopologyManager.parseTopology(
        topology.definition,
        schema
      );

      if (!definition) {
        console.error('[NET] Failed to parse incoming topology: ', topology);
        continue;
      }

      topologies.push({
        ...topology,
        definition: definition,
        ...this.buildTopologyMetadata(definition),
      });
    }

    return topologies.toSorted((a, b) =>
      (a.definition.get('name') as string)?.localeCompare(
        b.definition.get('name') as string
      )
    );
  }

  /**
   * Generates a valid interface ID for a given node.
   */
  private getNextInterface(nodeName: string): string {
    if (!this.editingTopology) return '';

    const deviceInfo = this.deviceStore.getInterfaceConfig(nodeName);
    const assignedNumbers = new Set(
      this.getAssignedInterfaces(
        nodeName,
        deviceInfo.interfacePattern,
        this.editingTopology.connectionMap
      )
    );
    let checkIndex = deviceInfo.interfaceStart;
    let validIndexFound = false;
    while (!validIndexFound) {
      validIndexFound = !assignedNumbers.has(checkIndex);
      checkIndex++;
    }

    return `${deviceInfo.interfacePattern.replaceAll('$', String(checkIndex))}`;
  }

  /**
   * Returns all assigned interface numbers for a given node.
   */
  private getAssignedInterfaces(
    nodeName: string,
    interfacePattern: string,
    connectionMap: Map<string, NodeConnection[]>
  ): number[] {
    return (connectionMap.get(nodeName) ?? [])
      .map(connection =>
        this.parseInterface(connection.hostInterface, interfacePattern)
      )
      .filter(index => index >= 0);
  }

  private parseInterface(value: string, interfacePattern: string): number {
    const pattern = new RegExp(interfacePattern.replaceAll('$', '(\\d+)'));
    const match = value.match(pattern);

    console.log('VALUE:', value, 'MATCH:', match, 'PATTERN:', pattern);

    if (!match || match.length < 2) return 99;
    return Number(match[1]);
  }

  /**
   * Generates a unique new name for a topology in a given group.
   */
  public static generateUniqueName(groupId: uuid4, topologies: Topology[]) {
    const groupTopologies = topologies
      .filter(topology => topology.groupId === groupId)
      .map(topology => topology.definition.getIn(['name']) as string);

    let equalNames = 0;
    let nameIndex = 0;
    do {
      nameIndex++;
      equalNames = groupTopologies.filter(
        topology => topology === TopologyDefaultName + String(nameIndex)
      ).length;
    } while (equalNames > 0);

    return TopologyDefaultName + String(nameIndex);
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

const TopologyDefaultName = 'topology';
