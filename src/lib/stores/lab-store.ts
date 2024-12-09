import {DataStore} from '@sb/lib/stores/data-store';
import {RootStore} from '@sb/lib/stores/root-store';
import {Lab, LabIn, LabState, NodeMeta} from '@sb/types/types';
import {action, computed, observable, observe, toJS} from 'mobx';

export class LabStore extends DataStore<Lab, LabIn, Lab> {
  @observable accessor totalEntries: number | null = null;
  @observable accessor limit: number = 5;
  @observable accessor offset: number = 0;
  @observable accessor stateFilter: LabState[] = [
    LabState.Deploying,
    LabState.Running,
  ];
  @observable accessor groupFilter: string[] = [];
  @observable accessor searchQuery: string = '';

  @observable accessor metaLookup: Map<string, Map<string, NodeMeta>> =
    new Map();

  constructor(rootStore: RootStore) {
    super(rootStore);

    observe(this, 'getParams' as keyof this, () => this.fetch());
  }

  protected get resourcePath(): string {
    return '/labs';
  }

  @computed
  protected get getParams() {
    return (
      `?limit=${this.limit}` +
      `&offset=${this.offset}` +
      `&stateFilter=${JSON.stringify(this.stateFilter)}` +
      `&searchQuery=${JSON.stringify(this.searchQuery)}` +
      `&groupFilter=${JSON.stringify(this.groupFilter)}`
    );
  }

  @action
  protected handleUpdate(updatedData: Lab[], headers: Headers | null): void {
    this.data = updatedData;
    this.totalEntries = Number(headers!.get('X-Total-Count'));

    console.log('LABS:', toJS(this.data));
    this.metaLookup = new Map(
      this.data.map(lab => [
        lab.id,
        new Map(lab.nodeMeta.map(meta => [meta.name, meta])),
      ])
    );
  }

  @action
  public setLimit(limit: number) {
    this.limit = limit;
  }

  @action
  public setOffset(offset: number) {
    this.offset = offset;
  }

  @action
  public setStateFilter(stateFilter: LabState[]) {
    this.stateFilter = stateFilter;
  }

  @action
  public setGroupFilter(groupFilter: string[]) {
    this.groupFilter = groupFilter;
  }

  @action
  public setSearchQuery(searchQuery: string) {
    this.searchQuery = searchQuery;
  }

  public toggleStateFilter(state: LabState) {
    if (this.stateFilter.includes(state)) {
      this.setStateFilter(this.stateFilter.filter(s => s !== state));
    } else {
      this.setStateFilter([...this.stateFilter, state]);
    }
  }

  public toggleGroupFilter(group: string) {
    if (this.groupFilter.includes(group)) {
      this.setGroupFilter(this.groupFilter.filter(g => g !== group));
    } else {
      this.setGroupFilter([...this.groupFilter, group]);
    }
  }
}
