import {action, observable} from 'mobx';

import {DataStore} from '@sb/lib/stores/data-store';
import {ClabSchema, DefaultFetchReport, FetchReport} from '@sb/types/types';

export class SchemaStore extends DataStore<ClabSchema, void, ClabSchema> {
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;
  @observable accessor clabSchema: ClabSchema | null = null;

  protected get isExternal(): boolean {
    return true;
  }

  protected get resourcePath(): string {
    return process.env.SB_CLAB_SCHEMA_URL!;
  }

  @action
  protected handleUpdate(updatedData: ClabSchema[]): void {
    // We do this here as it's the only resource that doesn't come as a list
    // TODO: Make it so the response can be a list or a single object
    this.clabSchema = updatedData as unknown as ClabSchema;
  }
}
