import {RootStore} from '@sb/lib/stores/root-store';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  Lab,
  LabIn,
  LabState,
} from '@sb/types/types';
import {action, observable, observe} from 'mobx';

export class LabStore {
  private rootStore: RootStore;

  @observable accessor labs: Lab[] = [];
  @observable accessor lookup: Map<string, Lab> = new Map();
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;

  @observable accessor limit: number = 5;
  @observable accessor offset: number = 0;
  @observable accessor filters: LabState[] = [1, 2];
  @observable accessor groupFilter: string[] = [];
  @observable accessor query: string = '';
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    observe(rootStore._apiConnectorStore, () => this.fetch());

    this.fetch();
  }

  public async add(lab: LabIn): Promise<ErrorResponse | null> {
    const response = await this.rootStore._apiConnectorStore.post<LabIn, void>(
      '/labs',
      lab
    );
    if (!response[0]) {
      return response[1] as ErrorResponse;
    }

    this.fetch();

    return null;
  }

  @action
  public setParameters(
    limit: number,
    offset: number,
    query: string,
    filters: LabState[],
    selectedGroups: string[]
  ) {
    this.limit = limit;
    this.offset = offset;
    this.query = query;
    this.filters = filters;
    this.groupFilter = selectedGroups;
    this.fetch();
  }

  @action
  public fetch() {
    if (!this.rootStore._apiConnectorStore.isLoggedIn) {
      this.fetchReport = {state: FetchState.Pending};
    }

    try {
      this.rootStore._apiConnectorStore
        .get<
          Lab[]
        >(`/labs?limit=${this.limit}&offset=${this.offset}&stateFilter=${JSON.stringify(this.filters)}&searchQuery=${JSON.stringify(this.query)}&groupFilter=${JSON.stringify(this.groupFilter)}`)
        .then(data => this.updateStore(data));
    } catch (error) {
      this.fetchReport = {
        state: FetchState.Error,
        errorCode: '500',
        errorMessage: 'Failed to fetch labs.',
      };
    }
  }

  @action
  private updateStore(data: [boolean, Lab[] | ErrorResponse]) {
    if (data[0]) {
      this.labs = data[1] as Lab[];
      this.fetchReport = {state: FetchState.Done};
    } else {
      this.fetchReport = {
        state: FetchState.Error,
        errorCode: String((data[1] as ErrorResponse).code),
        errorMessage: (data[1] as ErrorResponse).message,
      };
    }
  }
  @action
  public async update(lab: Lab): Promise<ErrorResponse | null> {
    const response = await this.rootStore._apiConnectorStore.patch<LabIn, void>(
      `/labs/${lab.id}`,
      {
        name: lab.name,
        startDate: lab.startDate,
        endDate: lab.endDate,
        topologyId: lab.topologyId,
      }
    );
    if (!response[0]) {
      return response[1] as ErrorResponse;
    }

    void this.fetch();
    return null;
  }
}
