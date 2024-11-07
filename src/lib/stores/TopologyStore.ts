import {action, observable, observe} from 'mobx';

import {RootStore} from '@sb/lib/stores/RootStore';
import {TopologyManager} from '@sb/lib/TopologyManager';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  Topology,
  TopologyOut,
} from '@sb/types/Types';

export class TopologyStore {
  private rootStore: RootStore;

  @observable accessor topologies: Topology[] = [];
  @observable accessor lookup: Map<string, Topology> = new Map();
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;
  @observable accessor manager = new TopologyManager();

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    observe(rootStore.apiConnectorStore, () => this.fetch());

    this.fetch();
  }

  public fetch() {
    this.rootStore.apiConnectorStore
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
