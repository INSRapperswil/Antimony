import {action, observable, observe} from 'mobx';

import {RootStore} from '@sb/lib/stores/root-store';
import {TopologyManager} from '@sb/lib/topology-manager';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  Topology,
  TopologyIn,
  TopologyOut,
  TopologyResponse,
  uuid4,
} from '@sb/types/types';
import YAML from 'yaml';

const TopologyDefaultName = 'topology';

export class TopologyStore {
  private rootStore: RootStore;
  public manager: TopologyManager;

  @observable accessor topologies: Topology[] = [];
  @observable accessor lookup: Map<string, Topology> = new Map();
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.manager = new TopologyManager(this.rootStore._apiConnectorStore, this);

    observe(rootStore._apiConnectorStore, () => this.fetch());

    void this.fetch();
  }

  public async fetch() {
    if (!this.rootStore._apiConnectorStore.isLoggedIn) {
      this.fetchReport = {state: FetchState.Pending};
      return;
    }

    const data =
      await this.rootStore._apiConnectorStore.get<TopologyOut[]>('/topologies');
    this.setData(data);
  }

  public async delete(id: string): Promise<ErrorResponse | null> {
    const response = await this.rootStore._apiConnectorStore.delete<void>(
      `/topologies/${id}`
    );
    if (!response[0]) {
      return response[1] as ErrorResponse;
    }

    void this.fetch();
    return null;
  }

  public async add(
    groupId: uuid4
  ): Promise<[boolean, ErrorResponse | TopologyResponse]> {
    const response = await this.rootStore._apiConnectorStore.post<
      TopologyIn,
      TopologyResponse
    >('/topologies', {
      groupId: groupId,
      definition: YAML.stringify({
        name: this.generateUniqueName(groupId),
        topology: {nodes: {}},
      }),
    });
    if (!response[0]) {
      return [false, response[1]];
    }

    await this.fetch();

    return [true, response[1]];
  }

  public async update(topology: Topology): Promise<ErrorResponse | null> {
    const response = await this.rootStore._apiConnectorStore.patch<
      TopologyIn,
      void
    >(`/topologies/${topology.id}`, {
      groupId: topology.groupId,
      definition: topology.definition.toString(),
    });
    if (!response[0]) {
      return response[1] as ErrorResponse;
    }

    void this.fetch();
    return null;
  }

  @action
  private setData(
    data: [boolean, TopologyOut[] | ErrorResponse, Headers | null]
  ) {
    if (data[0]) {
      this.topologies = TopologyManager.parseTopologies(
        data[1] as TopologyOut[]
      );
      this.lookup = new Map(
        this.topologies.map(topology => [topology.id, topology])
      );
      this.fetchReport = {state: FetchState.Done};
    } else {
      this.fetchReport = {
        state: FetchState.Error,
        errorCode: String((data[1] as ErrorResponse).code),
        errorMessage: (data[1] as ErrorResponse).message,
      };
    }
  }

  private generateUniqueName(groupId: uuid4) {
    const groupTopologies = this.topologies
      .filter(topology => topology.groupId === groupId)
      .map(topology => topology.definition.getIn(['name']) as string);

    let equalNames = 0;
    let nameIndex = 0;
    do {
      nameIndex++;
      equalNames = groupTopologies.filter(
        topology => topology === TopologyDefaultName + String(nameIndex)
      ).length;
    } while (equalNames > 0);

    return TopologyDefaultName + String(nameIndex);
  }
}
