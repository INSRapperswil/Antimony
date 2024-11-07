import {RootStore} from '@sb/lib/stores/RootStore';
import {
  ClabSchema,
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
} from '@sb/types/Types';
import {makeAutoObservable} from 'mobx';

export class SchemaStore {
  private rootStore: RootStore;

  public clabSchema: ClabSchema | null = null;
  public fetchReport: FetchReport = DefaultFetchReport;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;

    this.fetch();
  }

  public fetch() {
    this.rootStore.apiConnectorStore
      .get<ClabSchema>(process.env.SB_CLAB_SCHEMA_URL!, true)
      .then(data => {
        if (data[0]) {
          this.clabSchema = data[1] as ClabSchema;
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
