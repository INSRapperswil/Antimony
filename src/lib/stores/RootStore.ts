import {APIConnectorStore} from '@sb/lib/stores/APIConnectorStore';
import {DeviceStore} from '@sb/lib/stores/DeviceStore';

import {GroupStore} from '@sb/lib/stores/GroupStore';
import {SchemaStore} from '@sb/lib/stores/SchemaStore';
import {TopologyStore} from '@sb/lib/stores/TopologyStore';
import {combinedFetchState} from '@sb/lib/utils/Utils';
import {FetchState} from '@sb/types/Types';
import {action, observable, observe} from 'mobx';
import {createContext, useContext} from 'react';

export class RootStore {
  _apiConnectorStore: APIConnectorStore;
  _topologyStore: TopologyStore;
  _deviceStore: DeviceStore;
  _groupStore: GroupStore;
  _schemaStore: SchemaStore;

  @observable accessor combinedFetchState: FetchState = FetchState.Pending;

  constructor() {
    this._apiConnectorStore = new APIConnectorStore(this);
    this._topologyStore = new TopologyStore(this);
    this._deviceStore = new DeviceStore(this);
    this._groupStore = new GroupStore(this);
    this._schemaStore = new SchemaStore(this);

    observe(this._topologyStore, () => this.getCombinedFetchState());
    observe(this._deviceStore, () => this.getCombinedFetchState());
    observe(this._groupStore, () => this.getCombinedFetchState());
    observe(this._schemaStore, () => this.getCombinedFetchState());
  }

  @action
  private getCombinedFetchState() {
    this.combinedFetchState = combinedFetchState(
      this._topologyStore.fetchReport.state,
      this._deviceStore.fetchReport.state,
      this._groupStore.fetchReport.state,
      this._schemaStore.fetchReport.state
    );
  }
}

export const rootStore = new RootStore();
export const RootStoreContext = createContext(rootStore);

export const useRootStore = () => {
  return useContext(RootStoreContext);
};

export const useAPIStore = () => {
  return useContext(RootStoreContext)._apiConnectorStore;
};

export const useTopologyStore = () => {
  return useContext(RootStoreContext)._topologyStore;
};

export const useDeviceStore = () => {
  return useContext(RootStoreContext)._deviceStore;
};

export const useGroupStore = () => {
  return useContext(RootStoreContext)._groupStore;
};

export const useSchemaStore = () => {
  return useContext(RootStoreContext)._schemaStore;
};
