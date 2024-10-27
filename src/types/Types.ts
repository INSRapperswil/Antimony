export type uuid4 = string;

export type ErrorResponse = {
  code: number;
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
  nodeMeta: NodeMeta;
  edgesharkLink: string;
  runnerId: uuid4;
  latestStateChange: string;
  state: LabState;
};

export type RawLab = {
  item_Count: number;
  labs: Lab[];
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
  definition: TopologyDefinition;
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
        [key: string]: PropertyDefinition;
      };
    };
  };
}

export interface PropertyDefinition {
  type?: 'string' | 'array' | 'boolean' | 'integer';
  description: string;
  enum?: string[];
  minItems?: number;
  items?: PropertyDefinition;
  uniqueItems?: boolean;
  anyOf?: PropertyDefinition[];
}

export enum LabState {
  Scheduled,
  Deploying,
  Running,
  Failed,
  Done,
}

export enum FetchState {
  Fetching,
  Done,
  NetworkError,
}
