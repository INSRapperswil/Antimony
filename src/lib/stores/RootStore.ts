import {createContext} from 'react';

import {GroupStore} from '@sb/lib/stores/GroupStore';
import {SchemaStore} from '@sb/lib/stores/SchemaStore';
import {DeviceStore} from '@sb/lib/stores/DeviceStore';
import {TopologyStore} from '@sb/lib/stores/TopologyStore';
import {APIConnectorStore} from '@sb/lib/stores/APIConnectorStore';

export class RootStore {
  apiConnectorStore: APIConnectorStore;
  topologyStore: TopologyStore;
  deviceStore: DeviceStore;
  groupStore: GroupStore;
  schemaStore: SchemaStore;

  constructor() {
    this.apiConnectorStore = new APIConnectorStore(this);
    this.topologyStore = new TopologyStore(this);
    this.deviceStore = new DeviceStore(this);
    this.groupStore = new GroupStore(this);
    this.schemaStore = new SchemaStore(this);
  }
}

export const rootStore = new RootStore();
export const RootStoreContext = createContext(rootStore);
