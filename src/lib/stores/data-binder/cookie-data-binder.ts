import {DataBinder} from '@sb/lib/stores/data-binder/data-binder';
import {generateUuidv4} from '@sb/lib/utils/utils';
import {
  DeviceInfo,
  ErrorResponse,
  Group,
  Lab,
  LabIn,
  TopologyIn,
  TopologyOut,
  uuid4,
} from '@sb/types/types';
import Cookies from 'js-cookie';
import {computed, observable} from 'mobx';
import {io, Socket} from 'socket.io-client';

export class CookieDataBinder extends DataBinder {
  private authToken: string | null = null;
  private readonly retryTimer = 5000;

  @observable accessor isAdmin = false;
  @observable accessor isLoggedIn = false;

  @observable accessor hasAPIError = false;
  @observable accessor hasSocketError = false;
  @observable accessor hasExternalError = false;

  public socket: Socket = io();

  private async fetch<R, T>(
    url: string,
    path: string,
    method: string,
    body?: R
  ): Promise<[boolean, T | ErrorResponse, Headers | null]> {
    const parts = path.split('/');
    switch (parts[1]) {
      case 'topologies':
        return this.handleTopology(method, parts[2], body as TopologyIn) as [
          boolean,
          T | ErrorResponse,
          null,
        ];
      case 'labs':
        return this.handleLab(method, parts[2], body as LabIn) as [
          boolean,
          T | ErrorResponse,
          null,
        ];
      case 'devices':
        return this.handleDevices(method, parts[2], body as LabIn) as [
          boolean,
          T | ErrorResponse,
          null,
        ];
      case 'groups':
        return this.handleGroup() as [boolean, T | ErrorResponse, null];
    }

    return [true, responseBody.payload, headers];
  }

  private handleTopology(
    method: string,
    id?: uuid4,
    body?: TopologyIn
  ): [boolean, TopologyOut[] | ErrorResponse | null, null] {
    switch (method) {
      case 'GET':
        return safeParseJsonCookie('topologies', '[]') as [
          boolean,
          TopologyOut[],
          null,
        ];
      case 'DELETE':
        return this.deleteTopology(id) as [boolean, null | ErrorResponse, null];
      case 'PATCH':
        return this.patchTopology(id!, body!) as [
          boolean,
          ErrorResponse | null,
          null,
        ];
      case 'POST':
        return this.postTopology(body) as [
          boolean,
          string | ErrorResponse,
          null,
        ];
    }

    return [false, {code: '-1', message: 'Unknown method'}, null];
  }

  private handleLab(
    method: string,
    id?: uuid4,
    body?: TopologyIn
  ): [boolean, Lab[] | ErrorResponse, null] {
    switch (method) {
      case 'GET':
        return safeParseJsonCookie('labs', '[]') as [boolean, Lab[], null];
      case 'DELETE':
        return this.deleteTopology(id) as [
          boolean,
          Lab[] | ErrorResponse,
          null,
        ];
      case 'PATCH':
        return this.patchTopology(id, body) as [
          boolean,
          Lab[] | ErrorResponse,
          null,
        ];
      case 'POST':
        return this.postTopology(body) as [
          boolean,
          Lab[] | ErrorResponse,
          null,
        ];
    }

    return [false, {code: '-1', message: 'Unknown method'}, null];
  }

  private handleGroup(): [boolean, Group[] | ErrorResponse, null] {}

  private handleDevices(): [boolean, DeviceInfo[] | ErrorResponse, null] {}

  private deleteTopology(id?: uuid4): [boolean, ErrorResponse | null, null] {
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

    return [true, topologyId, null];
  }

  public async login(): Promise<boolean> {
    return true;
  }
  public logout() {}

  @computed
  public get hasConnectionError() {
    return false;
  }
}

function safeParseJsonCookie(key: string, defaultValue: string) {
  if (!Cookies.get(key)) {
    Cookies.set(key, defaultValue);
    return defaultValue;
  }

  try {
    return JSON.parse(Cookies.get(key)!);
  } catch (e) {
    console.warn(
      `[COOKIES] Failed to parse JSON from cookie '${key}'. Resetting to default value. Original value: ${Cookies.get(key)}`
    );
    Cookies.set(key, defaultValue);
    return defaultValue;
  }
}
