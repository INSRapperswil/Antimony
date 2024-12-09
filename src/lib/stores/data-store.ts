import {action, observable, observe} from 'mobx';

import {RootStore} from '@sb/lib/stores/root-store';
import {
  DefaultFetchReport,
  ErrorResponse,
  FetchReport,
  FetchState,
  PostResponse,
  uuid4,
} from '@sb/types/types';

export abstract class DataStore<T, I, O> {
  protected rootStore: RootStore;

  @observable accessor data: T[] = [];
  @observable accessor lookup: Map<string, T> = new Map();
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;

  protected abstract get resourcePath(): string;
  protected abstract handleUpdate(
    updatedData: O[],
    headers: Headers | null
  ): void;
  protected get isExternal(): boolean {
    return false;
  }

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    observe(rootStore._apiConnectorStore, () => this.fetch());

    void this.fetch();
  }

  public async fetch() {
    console.log('FETCHING WITH');
    if (!this.rootStore._apiConnectorStore.isLoggedIn) {
      this.fetchReport = {state: FetchState.Pending};
      return;
    }

    this.handleData(
      await this.rootStore._apiConnectorStore.get<O[]>(
        this.resourcePath + this.getParams,
        this.isExternal
      )
    );
  }

  public async delete(id: string): Promise<ErrorResponse | null> {
    const response = await this.rootStore._apiConnectorStore.delete<void>(
      `${this.resourcePath}/${id}` + this.deleteParams
    );
    if (!response[0]) {
      return response[1] as ErrorResponse;
    }

    void this.fetch();
    return null;
  }

  public async add(body: I): Promise<[boolean, ErrorResponse | PostResponse]> {
    const response = await this.rootStore._apiConnectorStore.post<
      I,
      PostResponse
    >(this.resourcePath + this.postParams, body);

    if (!response[0]) {
      return [false, response[1]];
    }

    await this.fetch();

    return [true, response[1]];
  }

  public async update(id: uuid4, body: I): Promise<ErrorResponse | null> {
    console.log(id);
    console.log(body);
    const response = await this.rootStore._apiConnectorStore.patch<I, void>(
      `${this.resourcePath}/${id}` + this.patchParams,
      body
    );

    if (!response[0]) {
      return response[1] as ErrorResponse;
    }

    void this.fetch();
    return null;
  }

  @action
  private handleData(data: [boolean, O[] | ErrorResponse, Headers | null]) {
    if (data[0]) {
      this.handleUpdate(data[1] as O[], data[2]);
      this.fetchReport = {state: FetchState.Done};
    } else {
      this.fetchReport = {
        state: FetchState.Error,
        errorCode: String((data[1] as ErrorResponse).code),
        errorMessage: (data[1] as ErrorResponse).message,
      };
    }
  }

  protected get getParams() {
    return '';
  }

  protected get postParams() {
    return '';
  }

  protected get patchParams() {
    return '';
  }

  protected get deleteParams() {
    return '';
  }
}
