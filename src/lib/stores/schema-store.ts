import {ClabSchema, DefaultFetchReport, FetchReport} from '@sb/types/types';
import {observable} from 'mobx';
import {DataStore} from '@sb/lib/stores/data-store';

export class SchemaStore extends DataStore<ClabSchema, void, ClabSchema> {
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;
  @observable accessor clabSchema: ClabSchema | null = null;

  protected get isExternal(): boolean {
    return true;
  }

  protected get resourcePath(): string {
    return process.env.SB_CLAB_SCHEMA_URL!;
  }

  protected handleUpdate(updatedData: ClabSchema[]): void {
    // We do this here as it's the only resource that doesn't come as a list
    this.clabSchema = updatedData as unknown as ClabSchema;
  }
}
