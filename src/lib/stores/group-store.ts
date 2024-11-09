import {RootStore} from '@sb/lib/stores/root-store';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  Group,
} from '@sb/types/types';
import {action, observable, observe} from 'mobx';

export class GroupStore {
  private rootStore: RootStore;

  @observable accessor groups: Group[] = [];
  @observable accessor groupLookup: Map<string, Group> = new Map();
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    observe(rootStore._apiConnectorStore, () => this.fetch());

    this.fetch();
  }

  public fetch() {
    if (!this.rootStore._apiConnectorStore.isLoggedIn) {
      this.fetchReport = {state: FetchState.Pending};
      return;
    }

    this.rootStore._apiConnectorStore
      .get<Group[]>('/groups')
      .then(data => this.update(data));
  }

  @action
  private update(data: [boolean, Group[] | ErrorResponse]) {
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
  }
}
