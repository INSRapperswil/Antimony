import {makeAutoObservable} from 'mobx';

import {RootStore} from '@sb/lib/stores/RootStore';
import {TopologyManager} from '@sb/lib/TopologyManager';
import {FetchState, Topology, TopologyOut} from '@sb/types/Types';

export class TopologyStore {
  private rootStore: RootStore;

  public topologies: Topology[] = [];
  public lookup: Map<string, Topology> = new Map();
  public fetchState: FetchState = FetchState.Pending;

  public manager = new TopologyManager();

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;

    this.fetch();
  }

  public fetch() {
    this.rootStore.apiConnectorStore
      .get<TopologyOut[]>('/topologies')
      .then(data => {
        if (data[0]) {
          this.topologies = TopologyManager.parseTopologies(
            data[1] as TopologyOut[]
          );
          this.lookup = new Map(
            this.topologies.map(topology => [topology.id, topology])
          );
          this.fetchState = FetchState.Done;
        } else {
          this.fetchState = FetchState.NetworkError;
        }
      });
  }
}
