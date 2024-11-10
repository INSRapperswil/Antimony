import {RootStore} from '@sb/lib/stores/root-store';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  Lab,
  LabIn,
} from '@sb/types/types';
import {action, observable, observe} from 'mobx';

export class LabStore {
  private rootStore: RootStore;

  @observable accessor labs: Lab[] = [];
  @observable accessor lookup: Map<string, Lab> = new Map();
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;

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
  public fetch() {
    if (!this.rootStore._apiConnectorStore.isLoggedIn) {
      this.fetchReport = {state: FetchState.Pending};
      return;
    }

    this.rootStore._apiConnectorStore
      .get<Lab[]>('/labs')
      .then(data => this.update(data));
  }

  @action
  private update(data: [boolean, Lab[] | ErrorResponse]) {
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
}

const IconMap = new Map([
  ['VM', 'virtualserver'],
  ['Generic', 'generic'],
  ['Router', 'router'],
  ['Switch', 'switch'],
  ['Container', 'computer'],
]);
