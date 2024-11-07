import {RootStore} from '@sb/lib/stores/RootStore';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  Group,
} from '@sb/types/Types';
import {makeAutoObservable, observe} from 'mobx';

export class GroupStore {
  private rootStore: RootStore;

  public groups: Group[] = [];
  public groupLookup: Map<string, Group> = new Map();
  public fetchReport: FetchReport = DefaultFetchReport;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;

    observe(rootStore.apiConnectorStore, () => this.fetch());

    this.fetch();
  }

  public fetch() {
    this.rootStore.apiConnectorStore.get<Group[]>('/groups').then(data => {
      if (data[0]) {
        this.groups = (data[1] as Group[]).toSorted((a, b) =>
          a.name.localeCompare(b.name)
        );
        this.groupLookup = new Map(this.groups.map(group => [group.id, group]));
        this.fetchReport = {state: FetchState.Done};
      } else {
        this.fetchReport = {
          state: FetchState.Error,
          errorCode: String((data[1] as ErrorResponse).code),
          errorMessage: (data[1] as ErrorResponse).message,
        };
      }
    });
  }
}
