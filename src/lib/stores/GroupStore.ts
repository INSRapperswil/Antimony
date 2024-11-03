import {RootStore} from '@sb/lib/stores/RootStore';
import {FetchState, Group} from '@sb/types/Types';
import {makeAutoObservable} from 'mobx';

export class GroupStore {
  private rootStore: RootStore;

  public groups: Group[] = [];
  public groupLookup: Map<string, Group> = new Map();
  public fetchState: FetchState = FetchState.Pending;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;

    this.fetch();
  }

  public fetch() {
    this.rootStore.apiConnectorStore.get<Group[]>('/groups').then(data => {
      if (data[0]) {
        this.groups = data[1] as Group[];
        this.groupLookup = new Map(this.groups.map(group => [group.id, group]));
        this.fetchState = FetchState.Done;
      } else {
        this.fetchState = FetchState.NetworkError;
      }
    });
  }
}
