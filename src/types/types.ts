import React from 'react';
import {IdType} from 'vis-network';
import {Document, ToJSOptions} from 'yaml';

/*
 * Generic wrapper around the YAML document object for type specification
 */
export class YAMLDocument<T> extends Document {
  toJS(opt?: ToJSOptions & {[p: string]: unknown}): T {
    return super.toJS(opt) as T;
  }
}

export type uuid4 = string;

export type ErrorResponse = {
  code: string;
  message: string;
};

export type AuthResponse = {
  token: string;
  isAdmin: boolean;
};

export type LabIn = {
  name: string;
  startDate: string;
  endDate: string;
  topologyId: uuid4;
};

export type Lab = LabIn & {
  id: uuid4;
  groupId: uuid4;
  nodeMeta: NodeMeta[];
  edgesharkLink: string;
  runnerId: uuid4;
  latestStateChange: string;
  state: LabState;
};

export type PostResponse = {
  id: uuid4;
};

export type TopologyIn = {
  groupId: uuid4;
  definition: string;
};

export type TopologyOut = TopologyIn & {
  id: uuid4;
  creatorId: uuid4;
};

export type TopologyMeta = {
  positions: Map<string, Position>;
  connections: NodeConnection[];
  connectionMap: Map<string, NodeConnection[]>;
};

export type Topology = TopologyMeta & {
  id: uuid4;
  definition: YAMLDocument<TopologyDefinition>;
  groupId: uuid4;
  creatorId: uuid4;
};

export type GroupIn = {
  name: string;
  canWrite: boolean;
  canRun: boolean;
};

export type Group = GroupIn & {
  id: uuid4;
};

export type User = {
  id: uuid4;
  username: string;
  creation: string;
};

export type UserCredentials = {
  username: string;
  password: string;
};

export type DeviceInfo = InterfaceConfig & {
  kind: string;
  name: string;
  images: string[];
  type: string;
};

export type InterfaceConfig = {
  interfacePattern: string;
  interfaceStart: number;
};

export type NodeMeta = {
  name: string;
  user: string;
  host: string;
  port: number;
  webSsh: string;
};

export interface TopologyDefinition {
  name: string;
  topology: {
    nodes: {[nodeName: string]: {kind?: string}};
    links: {
      endpoints: string;
    };
  };
}

export interface NodeConnection {
  id: number;
  hostNode: string;
  hostInterface: string;
  targetNode: string;
  targetInterface: string;
}

export interface ClabSchema {
  definitions: {
    'node-config': {
      properties: {
        [key: string]: PropertySchema;
      };
    };
  };
}

export interface NotificationOut {
  id: string;
  timestamp: string;
  summary: string;
  detail: string;
  severity: Severity;
}

export type Notification = {
  id: string;
  isRead: boolean;
  timestamp: Date;
  summary: string;
  detail: string;
  severity: Severity;
};

export enum Severity {
  Error,
  Warning,
  Success,
  Info,
}

export type PrimeSeverity = 'success' | 'info' | 'warn' | 'error';

export const SeverityMapping: {[key in Severity]: PrimeSeverity} = {
  [Severity.Error]: 'error',
  [Severity.Warning]: 'warn',
  [Severity.Success]: 'success',
  [Severity.Info]: 'info',
};

export type Position = {
  x: number;
  y: number;
};

export type FieldType = string | string[] | boolean | number;

export type PropertyType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object';

export interface PropertySchema {
  type?: PropertyType;
  enum?: string[];
  minItems?: number;
  items?: PropertySchema;
  description: string;
  uniqueItems?: boolean;
  anyOf?: PropertySchema[];
}

export interface PatternPropertyDefinition {
  '.*'?: {
    oneOf: PropertySchema[];
  };

  '.+'?: {
    anyOf: PropertySchema[];
  };
}

export interface FetchReport {
  state: FetchState;
  errorMessage?: string;
  errorCode?: string;
}

export type OptionGroupOptions = {
  optionGroup: {
    value: string;
  };
};

export enum LabState {
  Scheduled,
  Deploying,
  Running,
  Failed,
  Done,
}

export enum FetchState {
  Pending,
  Done,
  Error,
}

export interface GraphEventPointer {
  DOM: Position;
  canvas: Position;
}

export interface GraphBaseEvent {
  event: React.SyntheticEvent;
  pointer: GraphEventPointer;
}

export interface GraphNodeClickEvent extends GraphBaseEvent {
  nodes: IdType[];
  edges: IdType[];
}

export interface GraphNodeHoverEvent extends GraphBaseEvent {
  nodeId: IdType;
}

export interface GraphEdgeHoverEvent extends GraphBaseEvent {
  edgeId: IdType;
}

export const DefaultFetchReport = {
  state: FetchState.Pending,
};
