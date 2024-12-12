import {ErrorResponse, UserCredentials} from '@sb/types/types';
import {observable} from 'mobx';

export abstract class DataBinder {
  @observable accessor isAdmin = false;
  @observable accessor isLoggedIn = false;

  public abstract logout(): void;

  public abstract login(
    credentials: UserCredentials,
    saveCookie: boolean
  ): Promise<boolean>;

  protected abstract fetch<R, T>(
    url: string,
    path: string,
    method: string,
    body?: R,
    isExternal?: boolean,
    skipAuthentication?: boolean
  ): Promise<[boolean, T | ErrorResponse, Headers | null]>;

  public abstract get hasConnectionError(): boolean;

  public async get<T>(
    url: string,
    path: string,
    isExternal = false,
    skipAuthentication = false
  ): Promise<[boolean, T | ErrorResponse, Headers | null]> {
    return this.fetch<void, T>(
      url,
      path,
      'GET',
      undefined,
      isExternal,
      skipAuthentication
    );
  }

  public async delete<T>(
    url: string,
    path: string,
    isExternal = false,
    skipAuthentication = false
  ): Promise<[boolean, T | ErrorResponse, Headers | null]> {
    return this.fetch<void, T>(
      url,
      path,
      'DELETE',
      undefined,
      isExternal,
      skipAuthentication
    );
  }

  public async post<R, T>(
    url: string,
    path: string,
    body: R,
    isExternal = false,
    skipAuthentication = false
  ): Promise<[boolean, T | ErrorResponse, Headers | null]> {
    return this.fetch<R, T>(
      url,
      path,
      'POST',
      body,
      isExternal,
      skipAuthentication
    );
  }

  public async patch<R, T>(
    url: string,
    path: string,
    body: R,
    isExternal = false,
    skipAuthentication = false
  ): Promise<[boolean, T | ErrorResponse, Headers | null]> {
    return this.fetch<R, T>(
      url,
      path,
      'PATCH',
      body,
      isExternal,
      skipAuthentication
    );
  }
}
