import {RootStore} from '@sb/lib/stores/RootStore';
import {
  ClabSchema,
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
} from '@sb/types/Types';
import {observable} from 'mobx';

export class SchemaStore {
  private rootStore: RootStore;

  @observable accessor clabSchema: ClabSchema | null = null;
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    this.fetch();
  }

  public fetch() {
    this.rootStore._apiConnectorStore
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
