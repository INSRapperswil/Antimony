import {DeviceInfo, TopologyNode} from '@sb/types/Types';

export class DeviceManager {
  private readonly deviceInfoMap: Map<string, DeviceInfo>;

  constructor(devices: DeviceInfo[]) {
    this.deviceInfoMap = new Map(devices.map(device => [device.kind, device]));
  }

  public getNodeIcon(node: TopologyNode) {
    if (!node) return '';

    let iconName;
    const deviceInfo = this.deviceInfoMap.get(node.kind);
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
