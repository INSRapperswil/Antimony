import {FieldType} from '@sb/lib/TopologyManager';
import {ClabSchema, TopologyDefinition, TopologyNode} from '@sb/types/Types';
import cloneDeep from 'lodash.clonedeep';
import {validate} from 'jsonschema';
import {NotificationController} from '@sb/lib/NotificationController';
import _ from 'lodash';

export type NodeProperty = {
  key: string;
  value: string;
  type: FieldType;
  index: number;
};

export class NodeEditor {
  private readonly editingNode: string;
  private readonly originalTopology: TopologyDefinition;
  private readonly notifications: NotificationController;

  private editingTopology: TopologyDefinition;

  public readonly clabSchema: ClabSchema;

  constructor(
    clabSchema: ClabSchema,
    editingNode: string,
    originalTopology: TopologyDefinition,
    notifications: NotificationController
  ) {
    this.clabSchema = clabSchema;
    this.editingNode = editingNode;
    this.notifications = notifications;
    this.originalTopology = originalTopology;
    this.editingTopology = cloneDeep(originalTopology);

    this.onNameUpdate = this.onNameUpdate.bind(this);
    this.onPropertyKeyUpdate = this.onPropertyKeyUpdate.bind(this);
    this.onPropertyValueUpdate = this.onPropertyValueUpdate.bind(this);
    this.onPropertyTypeUpdate = this.onPropertyTypeUpdate.bind(this);
    this.onPropertyIsListUpdate = this.onPropertyIsListUpdate.bind(this);
    this.onEnvironmentKeyUpdate = this.onEnvironmentKeyUpdate.bind(this);
    this.onEnvironmentValueUpdate = this.onEnvironmentValueUpdate.bind(this);
  }

  public onNameUpdate(value: string): string | null {
    if (value === this.editingNode) {
      return null;
    }

    if (value in this.editingTopology.topology.nodes) {
      this.notifications.error('Duplicate node name.', 'Schema Error');
      return 'Duplicate node name.';
    }

    const node = this.editingTopology.topology.nodes[this.editingNode];
    delete this.editingTopology.topology.nodes[this.editingNode];

    this.editingTopology.topology.nodes[value] = node;

    return null;
  }

  public onPropertyKeyUpdate(key: string, newKey: string): string | null {
    if (key === newKey) {
      return null;
    }

    if (newKey in this.editingTopology.topology.nodes[this.editingNode]) {
      this.notifications.error('Duplicate key', 'YAML Syntax Error');
      return 'Duplicate key';
    }

    const updatedTopology: TopologyDefinition = cloneDeep(this.editingTopology);
    const value =
      updatedTopology.topology.nodes[this.editingNode][
        key as keyof TopologyNode
      ];

    delete updatedTopology.topology.nodes[this.editingNode][
      key as keyof TopologyNode
    ];

    updatedTopology.topology.nodes[this.editingNode] = Object.assign(
      updatedTopology.topology.nodes[this.editingNode],
      {[newKey]: value}
    );

    return this.validateAndSetTopology(updatedTopology);
  }

  public onPropertyValueUpdate(
    key: string,
    value: string | string[],
    type: FieldType
  ): string | null {
    const isList = Array.isArray(value);
    const updatedTopology: TopologyDefinition = cloneDeep(this.editingTopology);

    switch (type) {
      case 'boolean':
        updatedTopology.topology.nodes[this.editingNode] = Object.assign(
          updatedTopology.topology.nodes[this.editingNode],
          isList ? {[key]: [Boolean(value)]} : {[key]: Boolean(value)}
        );
        break;
      case 'string':
        updatedTopology.topology.nodes[this.editingNode] = Object.assign(
          updatedTopology.topology.nodes[this.editingNode],
          isList ? {[key]: [value]} : {[key]: value}
        );
        break;
      case 'number':
        updatedTopology.topology.nodes[this.editingNode] = Object.assign(
          updatedTopology.topology.nodes[this.editingNode],
          isList ? {[key]: [Number(value)]} : {[key]: Number(value)}
        );
        break;
    }

    return this.validateAndSetTopology(
      updatedTopology,
      `Invalid value for property '${key}'`
    );
  }

  public onPropertyTypeUpdate(
    key: string,
    value: string,
    type: FieldType
  ): string | null {
    const updatedTopology: TopologyDefinition = cloneDeep(this.editingTopology);

    switch (type) {
      case 'string':
        updatedTopology.topology.nodes[this.editingNode] = Object.assign(
          updatedTopology.topology.nodes[this.editingNode],
          {[key]: value}
        );
        break;
      case 'number':
        updatedTopology.topology.nodes[this.editingNode] = Object.assign(
          updatedTopology.topology.nodes[this.editingNode],
          {[key]: Number(value)}
        );
        break;
      case 'boolean':
        updatedTopology.topology.nodes[this.editingNode] = Object.assign(
          updatedTopology.topology.nodes[this.editingNode],
          {[key]: Boolean(value)}
        );
        break;
    }

    return this.validateAndSetTopology(
      updatedTopology,
      `Schema does not allow '${type}' here.`
    );
  }

  public onPropertyIsListUpdate(
    key: string,
    value: string | string[],
    toList: boolean
  ): string | null {
    const updatedTopology: TopologyDefinition = cloneDeep(this.editingTopology);

    if (toList) {
      updatedTopology.topology.nodes[this.editingNode] = Object.assign(
        updatedTopology.topology.nodes[this.editingNode],
        {[key]: [(value as string).split('\n')]}
      );
    } else {
      updatedTopology.topology.nodes[this.editingNode] = Object.assign(
        updatedTopology.topology.nodes[this.editingNode],
        {[key]: (value as string[]).join('\n')}
      );
    }

    return this.validateAndSetTopology(
      updatedTopology,
      toList
        ? 'Schema does not allow list value.'
        : 'Schema does not allow single value.'
    );
  }

  /**
   * Checks whether a property of the currently edited node was changed. This includes the property keu, value and the
   * type of the value.
   *
   * @param key The key of the property.
   * @param originalValue The original value of the property.
   * @param originalType The original type of the property.
   */
  public wasPropertyEdited(
    key: string,
    originalValue: string,
    originalType: FieldType
  ): boolean {
    if (!(key in this.originalTopology!.topology.nodes[this.editingNode!])) {
      return true;
    }

    const currentValue =
      this.originalTopology!.topology.nodes[this.editingNode!][
        key as keyof TopologyNode
      ];
    const currentType: FieldType = typeof currentValue as FieldType;
    return (
      !_.isEqual(currentValue, originalValue) ||
      typeof currentType !== originalType
    );
  }

  /**
   * Returns all the properties of the currently edited node.
   */
  public getProperties(): NodeProperty[] {
    console.log('GET PROPERTIES');

    const properties: NodeProperty[] = [];

    for (const [index, [key, value]] of Object.entries(
      this.editingTopology.topology.nodes[this.editingNode]
    ).entries()) {
      if (key in IgnoredProperties) continue;

      properties.push({
        key,
        value,
        index,
        type: typeof value as FieldType,
      });
    }

    return properties;
  }

  public onEnvironmentKeyUpdate(key: string, newKey: string): string | null {
    console.log('Key: ', key, 'Value:', newKey);
    return null;
  }

  public onEnvironmentValueUpdate(key: string, value: string): string | null {
    console.log('Key: ', key, 'Value:', value);
    return null;
  }

  public getTopology(): TopologyDefinition {
    return this.editingTopology;
  }

  public getNode(): TopologyNode {
    return this.editingTopology.topology.nodes[this.editingNode];
  }

  private validateAndSetTopology(
    topology: TopologyDefinition,
    customErrorMessage: string | null = null
  ): string | null {
    const validation = validate(topology, this.clabSchema);

    if (validation.errors.length < 1) {
      this.editingTopology = topology;
      return null;
    } else {
      this.notifications.error(
        customErrorMessage ?? validation.errors[0].message,
        'YAML Schema Error'
      );
      return validation.errors[0].message;
    }
  }
}

const IgnoredProperties = ['kind', 'image'];
