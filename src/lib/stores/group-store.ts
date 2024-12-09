import {Group, GroupIn} from '@sb/types/types';
import {DataStore} from '@sb/lib/stores/data-store';

export class GroupStore extends DataStore<Group, GroupIn, Group> {
  protected get resourcePath(): string {
    return '/groups';
  }

  protected handleUpdate(updatedData: Group[]): void {
    this.data = updatedData.toSorted((a, b) => a.name.localeCompare(b.name));
    this.lookup = new Map(this.data.map(group => [group.id, group]));
  }
}
