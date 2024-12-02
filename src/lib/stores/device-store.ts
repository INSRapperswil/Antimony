import {DeviceInfo} from '@sb/types/types';
import {DataStore} from '@sb/lib/stores/data-store';

export class DeviceStore extends DataStore<DeviceInfo, DeviceInfo, DeviceInfo> {
  protected get resourcePath(): string {
    return '/devices';
  }

  protected handleUpdate(updatedData: DeviceInfo[]): void {
    this.data = updatedData;
  }

  public getNodeIcon(kind?: string) {
    let iconName;
    if (kind) {
      const deviceInfo = this.lookup.get(kind);
      if (deviceInfo) {
        iconName = IconMap.get(deviceInfo?.type);
      } else {
        iconName = 'generic';
      }
    }
    if (!kind || !iconName) iconName = 'generic';

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
