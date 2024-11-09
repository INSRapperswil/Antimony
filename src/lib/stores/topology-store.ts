import {action, observable, observe} from 'mobx';

import {RootStore} from '@sb/lib/stores/root-store';
import {TopologyManager} from '@sb/lib/topology-manager';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  Topology,
  TopologyOut,
} from '@sb/types/types';

export class TopologyStore {
  private rootStore: RootStore;

  @observable accessor topologies: Topology[] = [];
  @observable accessor lookup: Map<string, Topology> = new Map();
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;
  @observable accessor manager = new TopologyManager();

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
      .get<TopologyOut[]>('/topologies')
      .then(data => this.update(data));
  }

  @action
  private update(data: [boolean, TopologyOut[] | ErrorResponse]) {
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
