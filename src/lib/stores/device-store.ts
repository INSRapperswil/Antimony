import {DataStore} from '@sb/lib/stores/data-store';
import {DeviceInfo, InterfaceConfig} from '@sb/types/types';

export class DeviceStore extends DataStore<DeviceInfo, DeviceInfo, DeviceInfo> {
  protected get resourcePath(): string {
    return '/devices';
  }

  protected handleUpdate(updatedData: DeviceInfo[]): void {
    this.data = updatedData;
    this.lookup = new Map(this.data.map(device => [device.kind, device]));
  }

  public getNodeIcon(kind?: string) {
    let iconName;
    if (kind) {
      const deviceInfo = this.lookup.get(kind);
      if (deviceInfo) {
        iconName = IconMap.get(deviceInfo?.type);
      } else {
        iconName = 'router';
      }
    }
    if (!kind || !iconName) iconName = 'generic';

    return '/icons/' + iconName + '.svg';
  }

  /**
   * Returns the interface config of a given node.
   *
   * If the node's kind does not have a specific config, the default config
   * is returned instead.
   */
  public getInterfaceConfig(nodeKind: string) {
    return this.lookup.get(nodeKind) ?? DefaultDeviceConfig;
  }
}

const IconMap = new Map([
  ['VM', 'virtualserver'],
  ['Generic', 'generic'],
  ['Router', 'router'],
  ['Switch', 'switch'],
  ['Linux', 'linux'],
  ['Cisco', 'cisco'],
  ['Container', 'computer'],
  ['Docker', 'docker'],
]);

const DefaultDeviceConfig: InterfaceConfig = {
  interfacePattern: 'eth$',
  interfaceStart: 1,
};
