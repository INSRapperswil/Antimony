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
  templateId: uuid4;
};

export type Lab = {
  id: uuid4;
  name: string;
  startDate: string;
  endDate: string;
  groupId: uuid4;
  topologyId: uuid4;
  nodeMeta: NodeMeta[];
  edgesharkLink: string;
  runnerId: uuid4;
  latestStateChange: string;
  state: LabState;
};

export type TopologyIn = {
  name: string;
  definition: string;
};

export type TopologyOut = {
  id: uuid4;
  definition: string;
  groupId: uuid4;
  creatorId: uuid4;
};

export type Topology = {
  id: uuid4;
  definition: YAMLDocument<TopologyDefinition>;
  groupId: uuid4;
  creatorId: uuid4;
};

export type GroupIn = {
  name: string;
  public: boolean;
};

export type Group = {
  id: uuid4;
  name: string;
  public: boolean;
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

export type DeviceInfo = {
  kind: string;
  name: string;
  interfacePattern: string;
  interfaceStart: number;
  images: string[];
  type: string;
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
    nodes: {[nodeName: string]: TopologyNode};
    links: TopologyLink[];
  };
}

export interface TopologyNode {
  kind: string;
  image?: string;
}

export interface TopologyLink {
  endpoints: string[];
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

export interface Notification {
  id: string;
  timestamp: Date;
  summary: string;
  detail: string;
  severity: Severity;
  isRead: boolean;
}

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

export const DefaultFetchReport = {
  state: FetchState.Pending,
};
