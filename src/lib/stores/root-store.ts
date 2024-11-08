import {APIStore} from '@sb/lib/stores/api-store';
import {DeviceStore} from '@sb/lib/stores/device-store';

import {GroupStore} from '@sb/lib/stores/group-store';
import {NotificationStore} from '@sb/lib/stores/notification-store';
import {SchemaStore} from '@sb/lib/stores/schema-store';
import {TopologyStore} from '@sb/lib/stores/topology-store';
import {combinedFetchState} from '@sb/lib/utils/utils';
import {FetchState} from '@sb/types/types';
import {action, observable, observe} from 'mobx';
import {createContext, useContext} from 'react';

export class RootStore {
  _apiConnectorStore: APIStore;
  _topologyStore: TopologyStore;
  _deviceStore: DeviceStore;
  _groupStore: GroupStore;
  _schemaStore: SchemaStore;
  _notificationsStore: NotificationStore;

  @observable accessor combinedFetchState: FetchState = FetchState.Pending;

  constructor() {
    this._apiConnectorStore = new APIStore(this);
    this._topologyStore = new TopologyStore(this);
    this._deviceStore = new DeviceStore(this);
    this._groupStore = new GroupStore(this);
    this._schemaStore = new SchemaStore(this);
    this._notificationsStore = new NotificationStore(this);

    observe(this._topologyStore, () => this.getCombinedFetchState());
    observe(this._deviceStore, () => this.getCombinedFetchState());
    observe(this._groupStore, () => this.getCombinedFetchState());
    observe(this._schemaStore, () => this.getCombinedFetchState());
    observe(this._notificationsStore, () => this.getCombinedFetchState());
  }

  @action
  private getCombinedFetchState() {
    this.combinedFetchState = combinedFetchState(
      this._topologyStore.fetchReport.state,
      this._deviceStore.fetchReport.state,
      this._groupStore.fetchReport.state,
      this._schemaStore.fetchReport.state,
      this._notificationsStore.fetchReport.state
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

export const useNotifications = () => {
  return useContext(RootStoreContext)._notificationsStore;
};
