import {APIStore} from '@sb/lib/stores/api-store';
import {DeviceStore} from '@sb/lib/stores/device-store';

import {GroupStore} from '@sb/lib/stores/group-store';
import {LabStore} from '@sb/lib/stores/lab-store';
import {NotificationStore} from '@sb/lib/stores/notification-store';
import {SchemaStore} from '@sb/lib/stores/schema-store';
import {combinedFetchState} from '@sb/lib/utils/utils';
import {computed} from 'mobx';
import {createContext, useContext} from 'react';
import {TopologyStore} from '@sb/lib/stores/topology-store';

export class RootStore {
  _apiConnectorStore: APIStore;
  _topologyStore: TopologyStore;
  _labStore: LabStore;
  _calendarLabStore: LabStore;
  _deviceStore: DeviceStore;
  _groupStore: GroupStore;
  _schemaStore: SchemaStore;
  _notificationsStore: NotificationStore;

  constructor() {
    this._apiConnectorStore = new APIStore(this);
    this._schemaStore = new SchemaStore(this);
    this._deviceStore = new DeviceStore(this);
    this._topologyStore = new TopologyStore(this);
    this._labStore = new LabStore(this);
    this._calendarLabStore = new LabStore(this);
    this._groupStore = new GroupStore(this);
    this._notificationsStore = new NotificationStore(this);
  }

  @computed
  public get fetchState() {
    return combinedFetchState(
      this._topologyStore.fetchReport.state,
      this._labStore.fetchReport.state,
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

export const useLabStore = () => {
  return useContext(RootStoreContext)._labStore;
};

export const useCalendarLabStore = () => {
  return useContext(RootStoreContext)._calendarLabStore;
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
