import {RootStore} from '@sb/lib/stores/root-store';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  Group,
  GroupIn,
  uuid4,
} from '@sb/types/types';
import {action, observable, observe} from 'mobx';

export class GroupStore {
  private rootStore: RootStore;

  @observable accessor groups: Group[] = [];
  @observable accessor lookup: Map<string, Group> = new Map();
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
      .then(data => this.setData(data));
  }

  public async add(group: GroupIn): Promise<ErrorResponse | null> {
    const response = await this.rootStore._apiConnectorStore.post<
      GroupIn,
      void
    >('/groups', group);
    if (!response[0]) {
      return response[1] as ErrorResponse;
    }

    void this.fetch();
    return null;
  }

  public async delete(id: string): Promise<ErrorResponse | null> {
    const response = await this.rootStore._apiConnectorStore.delete<void>(
      `/groups/${id}`
    );
    if (!response[0]) {
      return response[1] as ErrorResponse;
    }

    void this.fetch();
    return null;
  }

  public async update(
    id: uuid4,
    group: GroupIn
  ): Promise<ErrorResponse | null> {
    const response = await this.rootStore._apiConnectorStore.patch<
      GroupIn,
      void
    >(`/groups/${id}`, group);
    if (!response[0]) {
      return response[1] as ErrorResponse;
    }

    void this.fetch();
    return null;
  }

  @action
  private setData(data: [boolean, Group[] | ErrorResponse]) {
    if (data[0]) {
      this.groups = (data[1] as Group[]).toSorted((a, b) =>
        a.name.localeCompare(b.name)
      );
      this.lookup = new Map(this.groups.map(group => [group.id, group]));
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
