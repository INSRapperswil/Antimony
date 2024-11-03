import {RootStore} from '@sb/lib/stores/RootStore';
import {DeviceInfo, FetchState, TopologyNode} from '@sb/types/Types';
import {makeAutoObservable} from 'mobx';

export class DeviceStore {
  private rootStore: RootStore;

  public devices: DeviceInfo[] = [];
  public lookup: Map<string, DeviceInfo> = new Map();
  public fetchState: FetchState = FetchState.Pending;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;

    this.fetch();
  }

  public fetch() {
    this.rootStore.apiConnectorStore
      .get<DeviceInfo[]>('/devices')
      .then(data => {
        if (data[0]) {
          this.devices = data[1] as DeviceInfo[];
          this.lookup = new Map(
            this.devices.map(device => [device.kind, device])
          );
          this.fetchState = FetchState.Done;
        } else {
          this.fetchState = FetchState.NetworkError;
        }
      });
  }

  public getNodeIcon(node: TopologyNode) {
    if (!node) return '';

    let iconName;
    const deviceInfo = this.lookup.get(node.kind);
    if (deviceInfo) {
      iconName = IconMap.get(deviceInfo?.type);
    } else {
      iconName = 'generic';
    }
    if (!iconName) iconName = 'generic';

    return './icons/' + iconName + '.svg';
  }
}

const IconMap = new Map([
  ['VM', 'virtualserver'],
  ['Generic', 'generic'],
  ['Router', 'router'],
  ['Switch', 'switch'],
  ['Container', 'computer'],
]);
