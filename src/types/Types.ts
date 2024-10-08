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

export type LabOut = {
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

export type Group = {
  id?: uuid4;
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
  name: string;
  fullName: string;
  type: DeviceType;
};

export type NodeMeta = {
  name: string;
  user: string;
  host: string;
  port: number;
  webSsh: string;
};

export enum DeviceType {
  Router,
  Switch,
  Container,
  VirtualMachine,
  Generic,
}

export enum LabState {
  Scheduled,
  Deploying,
  Running,
  Failed,
  Done,
}
