import {RootStore} from '@sb/lib/stores/RootStore';
import {ClabSchema, FetchState} from '@sb/types/Types';
import {makeAutoObservable} from 'mobx';

export class SchemaStore {
  private rootStore: RootStore;

  public clabSchema: ClabSchema | null = null;
  public fetchState: FetchState = FetchState.Pending;

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
          console.log('SET SHCMA:', data[1]);
          this.clabSchema = data[1] as ClabSchema;
          this.fetchState = FetchState.Done;
        } else {
          this.fetchState = FetchState.NetworkError;
        }
      });
  }
}
