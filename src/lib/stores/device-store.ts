import {RootStore} from '@sb/lib/stores/root-store';
import {
  DefaultFetchReport,
  DeviceInfo,
  ErrorResponse,
  FetchReport,
  FetchState,
  TopologyNode,
} from '@sb/types/types';
import {action, observable, observe} from 'mobx';

export class DeviceStore {
  private rootStore: RootStore;

  @observable accessor devices: DeviceInfo[] = [];
  @observable accessor lookup: Map<string, DeviceInfo> = new Map();
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    observe(rootStore._apiConnectorStore, () => this.fetch());

    this.fetch();
  }

  @action
  public fetch() {
    if (!this.rootStore._apiConnectorStore.isLoggedIn) {
      this.fetchReport = {state: FetchState.Pending};
      return;
    }

    this.rootStore._apiConnectorStore
      .get<DeviceInfo[]>('/devices')
      .then(data => this.update(data));
  }

  @action
  private update(data: [boolean, DeviceInfo[] | ErrorResponse]) {
    if (data[0]) {
      this.devices = data[1] as DeviceInfo[];
      this.fetchReport = {state: FetchState.Done};
    } else {
      this.fetchReport = {
        state: FetchState.Error,
        errorCode: String((data[1] as ErrorResponse).code),
        errorMessage: (data[1] as ErrorResponse).message,
      };
    }
  }

  public getNodeIcon(node?: TopologyNode) {
    let iconName;
    if (node) {
      const deviceInfo = this.lookup.get(node.kind);
      if (deviceInfo) {
        iconName = IconMap.get(deviceInfo?.type);
      } else {
        iconName = 'generic';
      }
    }
    if (!node || !iconName) iconName = 'generic';

    return '/icons/' + iconName + '.svg';
  }
}

const IconMap = new Map([
  ['VM', 'virtualserver'],
  ['Generic', 'generic'],
  ['Router', 'router'],
  ['Switch', 'switch'],
  ['Container', 'computer'],
]);
