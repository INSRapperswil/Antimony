import {action, observable, observe} from 'mobx';

import {RootStore} from '@sb/lib/stores/root-store';
import {TopologyManager} from '@sb/lib/topology-manager';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  Topology,
  TopologyDefinition,
  TopologyIn,
  TopologyOut,
} from '@sb/types/types';

export class TopologyStore {
  private rootStore: RootStore;
  public manager: TopologyManager;

  @observable accessor topologies: Topology[] = [];
  @observable accessor lookup: Map<string, Topology> = new Map();
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.manager = new TopologyManager(this.rootStore._apiConnectorStore);

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
      .get<TopologyOut[]>('/topologies')
      .then(data => this.setData(data));
  }

  @action
  public async update(
    id: string,
    definition: TopologyDefinition
  ): Promise<ErrorResponse | null> {
    const response = await this.rootStore._apiConnectorStore.patch<
      TopologyIn,
      void
    >(`/topologies/${id}`, {definition: JSON.stringify(definition)});
    if (!response[0]) {
      return response[1] as ErrorResponse;
    }

    void this.fetch();
    return null;
  }

  @action
  private setData(data: [boolean, TopologyOut[] | ErrorResponse]) {
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
}
