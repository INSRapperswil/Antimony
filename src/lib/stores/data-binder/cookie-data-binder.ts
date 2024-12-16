import Cookies from 'js-cookie';
import {computed, observable} from 'mobx';

import {
  DeviceInfo,
  ErrorResponse,
  Group,
  GroupIn,
  TopologyIn,
  TopologyOut,
  uuid4,
} from '@sb/types/types';
import {generateUuidv4} from '@sb/lib/utils/utils';
import devices from '@sb/../local-data/devices.json';
import {DataBinder} from '@sb/lib/stores/data-binder/data-binder';

export class CookieDataBinder extends DataBinder {
  @observable accessor isLoggedIn = true;
  @observable accessor hasExternalError = false;

  protected async fetch<R, T>(
    path: string,
    method: string,
    body?: R,
    isExternal = false
  ): Promise<[boolean, T | ErrorResponse, Headers | null]> {
    if (isExternal) {
      return this.fetchExternal(path, method, body);
    }

    const parts = path.split(/[/?&]/);
    switch (parts[1]) {
      case 'topologies':
        return this.handleTopologies(method, parts[2], body as TopologyIn) as [
          boolean,
          T | ErrorResponse,
          null,
        ];
      case 'groups':
        return this.handleGroups(method, parts[2], body as GroupIn) as [
          boolean,
          T | ErrorResponse,
          null,
        ];
      case 'devices':
        return this.handleDevices(method) as [boolean, T | ErrorResponse, null];
      case 'labs':
        return this.handleLabs(method) as [boolean, T | ErrorResponse, null];
      case 'notifications':
        return this.handleNotifications(method) as [
          boolean,
          T | ErrorResponse,
          null,
        ];
    }

    return [false, {code: '-1', message: `Invalid cookie URI '${path}'`}, null];
  }

  private handleTopologies(
    method: string,
    id?: uuid4,
    body?: TopologyIn
  ): [boolean, TopologyOut[] | ErrorResponse | string | null, null] {
    switch (method) {
      case 'GET':
        return [
          true,
          safeParseJsonCookie('topologies', '[]') as TopologyOut[],
          null,
        ];
      case 'DELETE':
        return this.deleteTopology(id!) as [
          boolean,
          null | ErrorResponse,
          null,
        ];
      case 'PATCH':
        return this.patchTopology(id!, body!) as [
          boolean,
          ErrorResponse | null,
          null,
        ];
      case 'POST':
        return this.postTopology(body!) as [
          boolean,
          string | ErrorResponse,
          null,
        ];
    }

    return [false, {code: '-1', message: 'Unknown method'}, null];
  }

  private deleteTopology(id: uuid4): [boolean, ErrorResponse | null, null] {
    const topologies = safeParseJsonCookie('topologies', '[]') as TopologyOut[];
    const topology = topologies.find(topology => topology.id === id);
    const topologyIndex = topology ? topologies.indexOf(topology) : -1;

    if (topologyIndex === -1) {
      return [false, {code: '-1', message: 'Topology ID not found'}, null];
    }

    topologies.splice(topologyIndex, 1);
    Cookies.set('topologies', JSON.stringify(topologies));

    return [true, null, null];
  }

  private patchTopology(
    id: uuid4,
    updatedTopology: TopologyIn
  ): [boolean, ErrorResponse | null, null] {
    const topologies = safeParseJsonCookie('topologies', '[]') as TopologyOut[];
    const topology = topologies.find(topology => topology.id === id);
    const topologyIndex = topology ? topologies.indexOf(topology) : -1;

    if (topologyIndex === -1) {
      return [false, {code: '-1', message: 'Topology ID not found'}, null];
    }

    topologies[topologyIndex] = {
      ...topologies[topologyIndex],
      ...updatedTopology,
    };
    Cookies.set('topologies', JSON.stringify(topologies));

    return [true, null, null];
  }

  private postTopology(
    topology: TopologyIn
  ): [boolean, string | ErrorResponse, null] {
    const topologies = safeParseJsonCookie('topologies', '[]') as TopologyOut[];
    const topologyId = generateUuidv4();

    const groups = safeParseJsonCookie('groups', '[]') as Group[];
    const targetGroup = groups.find(group => group.id === topology.groupId);
    if (!targetGroup) {
      return [false, {code: '-1', message: 'Invalid Group ID'}, null];
    }

    topologies.push({
      id: topologyId,
      creatorId: '-1',
      groupId: targetGroup.id,
      definition: topology.definition,
    });
    Cookies.set('topologies', JSON.stringify(topologies));

    return [true, topologyId, null];
  }

  private handleGroups(
    method: string,
    id?: uuid4,
    body?: GroupIn
  ): [boolean, Group[] | ErrorResponse | null, null] {
    switch (method) {
      case 'GET':
        return [true, safeParseJsonCookie('groups', '[]') as Group[], null];
      case 'DELETE':
        return this.deleteGroup(id!) as [boolean, ErrorResponse | null, null];
      case 'PATCH':
        return this.patchGroup(id!, body!) as [
          boolean,
          ErrorResponse | null,
          null,
        ];
      case 'POST':
        return this.postGroup(body!) as [boolean, ErrorResponse | null, null];
    }

    return [false, {code: '-1', message: 'Unknown method'}, null];
  }

  private deleteGroup(id: uuid4): [boolean, ErrorResponse | null, null] {
    const groups = safeParseJsonCookie('groups', '[]') as TopologyOut[];
    const group = groups.find(group => group.id === id);
    const groupIndex = group ? groups.indexOf(group) : -1;

    if (groupIndex === -1) {
      return [false, {code: '-1', message: 'Group ID not found'}, null];
    }

    groups.splice(groupIndex, 1);
    Cookies.set('groups', JSON.stringify(groups));

    return [true, null, null];
  }

  private patchGroup(
    id: uuid4,
    updatedGroup: GroupIn
  ): [boolean, ErrorResponse | null, null] {
    const groups = safeParseJsonCookie('groups', '[]') as TopologyOut[];
    const group = groups.find(group => group.id === id);
    const groupIndex = group ? groups.indexOf(group) : -1;

    if (groupIndex === -1) {
      return [false, {code: '-1', message: 'Group ID not found'}, null];
    }

    groups[groupIndex] = {
      ...groups[groupIndex],
      ...updatedGroup,
    };
    Cookies.set('groups', JSON.stringify(groups));

    return [true, null, null];
  }

  private postGroup(group: GroupIn): [boolean, ErrorResponse | null, null] {
    const groups = safeParseJsonCookie('groups', '[]') as Group[];
    const groupId = generateUuidv4();

    groups.push({
      id: groupId,
      name: group.name,
      canWrite: group.canWrite,
      canRun: group.canRun,
    });
    Cookies.set('groups', JSON.stringify(groups));

    return [true, null, null];
  }

  private handleDevices(
    method: string
  ): [boolean, DeviceInfo[] | ErrorResponse | null, null] {
    switch (method) {
      case 'GET':
        return [true, devices as DeviceInfo[], null];
    }

    return [false, {code: '-1', message: 'Unknown method'}, null];
  }

  private handleLabs(method: string): [boolean, DeviceInfo[] | null, null] {
    switch (method) {
      case 'GET':
        return [true, [], null];
    }

    return [true, null, null];
  }

  private handleNotifications(
    method: string
  ): [boolean, Notification[] | null, null] {
    switch (method) {
      case 'GET':
        return [true, [], null];
    }

    return [true, null, null];
  }

  public async login(): Promise<boolean> {
    return true;
  }
  public logout() {}

  @computed
  public get hasConnectionError() {
    return this.hasExternalError;
  }
}

function safeParseJsonCookie(key: string, defaultValue: string) {
  if (!Cookies.get(key)) {
    Cookies.set(key, defaultValue);
    return JSON.parse(defaultValue);
  }

  try {
    return JSON.parse(Cookies.get(key)!);
  } catch (e) {
    console.warn(
      `[COOKIES] Failed to parse JSON from cookie '${key}'. Resetting to default value. Original value: ${Cookies.get(key)}`
    );
    Cookies.set(key, defaultValue);
    return JSON.parse(defaultValue);
  }
}
