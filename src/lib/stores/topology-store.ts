import {observe} from 'mobx';

import {RootStore} from '@sb/lib/stores/root-store';
import {TopologyManager} from '@sb/lib/topology-manager';
import {Topology, TopologyIn, TopologyOut} from '@sb/types/types';
import {DataStore} from '@sb/lib/stores/data-store';

export class TopologyStore extends DataStore<
  Topology,
  TopologyIn,
  TopologyOut
> {
  public manager: TopologyManager;

  constructor(rootStore: RootStore) {
    super(rootStore);
    this.manager = new TopologyManager(
      this.rootStore._apiConnectorStore,
      this,
      this.rootStore._deviceStore
    );

    observe(rootStore._schemaStore.fetchReport, () => this.fetch());
  }

  protected get resourcePath(): string {
    return '/topologies';
  }

  protected handleUpdate(updatedData: TopologyOut[]): void {
    if (!this.rootStore._schemaStore?.clabSchema) return;

    this.data = this.manager.parseTopologies(
      updatedData,
      this.rootStore._schemaStore.clabSchema
    );
    this.lookup = new Map(this.data.map(topology => [topology.id, topology]));
  }
}
