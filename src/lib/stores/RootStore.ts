import {APIConnectorStore} from '@sb/lib/stores/APIConnectorStore';
import {DeviceStore} from '@sb/lib/stores/DeviceStore';

import {GroupStore} from '@sb/lib/stores/GroupStore';
import {SchemaStore} from '@sb/lib/stores/SchemaStore';
import {TopologyStore} from '@sb/lib/stores/TopologyStore';
import {combinedFetchState} from '@sb/lib/utils/Utils';
import {FetchState} from '@sb/types/Types';
import {action, observable, observe} from 'mobx';
import {createContext} from 'react';

export class RootStore {
  apiConnectorStore: APIConnectorStore;
  topologyStore: TopologyStore;
  deviceStore: DeviceStore;
  groupStore: GroupStore;
  schemaStore: SchemaStore;

  @observable accessor combinedFetchState: FetchState = FetchState.Pending;

  constructor() {
    this.apiConnectorStore = new APIConnectorStore(this);
    this.topologyStore = new TopologyStore(this);
    this.deviceStore = new DeviceStore(this);
    this.groupStore = new GroupStore(this);
    this.schemaStore = new SchemaStore(this);

    observe(this.topologyStore, () => this.getCombinedFetchState());
    observe(this.deviceStore, () => this.getCombinedFetchState());
    observe(this.groupStore, () => this.getCombinedFetchState());
    observe(this.schemaStore, () => this.getCombinedFetchState());
  }

  @action
  private getCombinedFetchState() {
    this.combinedFetchState = combinedFetchState(
      this.topologyStore.fetchReport.state,
      this.deviceStore.fetchReport.state,
      this.groupStore.fetchReport.state,
      this.schemaStore.fetchReport.state
    );
  }
}

export const rootStore = new RootStore();
export const RootStoreContext = createContext(rootStore);
