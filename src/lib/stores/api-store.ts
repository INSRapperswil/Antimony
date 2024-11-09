import {RootStore} from '@sb/lib/stores/root-store';
import {AuthResponse, ErrorResponse, UserCredentials} from '@sb/types/types';
import {action, computed, observable, runInAction} from 'mobx';
import Cookies from 'js-cookie';
import {io, Socket} from 'socket.io-client';

export class APIStore {
  private readonly apiUrl = process.env.SB_API_SERVER_URL;
  private rootStore: RootStore;
  private authToken: string | null = null;
  private readonly retryTimer = 5000;

  @observable accessor isAdmin = false;
  @observable accessor isLoggedIn = false;

  @observable accessor hasAPIError = false;
  @observable accessor hasSocketError = false;
  @observable accessor hasExternalError = false;

  public socket: Socket = io();

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    if (Cookies.get('authToken') !== undefined) {
      this.setupConnection(
        Cookies.get('authToken')!,
        Boolean(Cookies.get('isAdmin')) ?? false
      );
    }
  }

  public async login(
    credentials: UserCredentials,
    saveCookie: boolean
  ): Promise<boolean> {
    const tokenResponse = await this.post<UserCredentials, AuthResponse>(
      '/users/auth',
      credentials,
      false,
      true
    );
    if (!tokenResponse[0]) {
      console.error(
        '[AUTH] Failed to login user with provided credentials. Aborting.'
      );
      return false;
    }

    const authResponse = tokenResponse[1] as AuthResponse;
    this.setupConnection(authResponse.token, authResponse.isAdmin);
    if (saveCookie) {
      Cookies.set('authToken', this.authToken!);
      Cookies.set('isAdmin', String(this.isAdmin));
    }

    return true;
  }

  public async get<T>(
    path: string,
    isExternal = false,
    skipAuthentication = false
  ) {
    return this.fetch<void, T>(
      path,
      'GET',
      undefined,
      isExternal,
      skipAuthentication
    );
  }

  public async delete<T>(
    path: string,
    isExternal = false,
    skipAuthentication = false
  ) {
    return this.fetch<void, T>(
      path,
      'DELETE',
      undefined,
      isExternal,
      skipAuthentication
    );
  }

  public async post<R, T>(
    path: string,
    body: R,
    isExternal = false,
    skipAuthentication = false
  ) {
    return this.fetch<R, T>(path, 'POST', body, isExternal, skipAuthentication);
  }

  public async patch<R, T>(
    path: string,
    body: R,
    isExternal = false,
    skipAuthentication = false
  ) {
    return this.fetch<R, T>(
      path,
      'PATCH',
      body,
      isExternal,
      skipAuthentication
    );
  }

  private async fetch<R, T>(
    path: string,
    method: string,
    body?: R,
    isExternal = false,
    skipAuthentication = false
  ): Promise<[boolean, T | ErrorResponse]> {
    if (!skipAuthentication && !isExternal && !this.isLoggedIn) {
      return [false, {code: '-1', message: 'Unauthorized'}];
    }

    let response: Response | null = null;

    try {
      if (isExternal) {
        response = await fetch(path, {
          method: method,
          body: JSON.stringify(body),
        });
      } else {
        response = await fetch(this.apiUrl + path, {
          method: method,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify(body),
        });
      }
    } catch {
      // continue regardless of error
    }

    if (!response || !response.ok) {
      this.handleNetworkError(response?.status, isExternal);
      await new Promise(resolve => setTimeout(resolve, this.retryTimer));
      return this.fetch(path, method, body, isExternal, skipAuthentication);
    }

    if (isExternal) {
      return [true, JSON.parse(await response.text())];
    }

    const responseBody = await response.json();

    if ('code' in responseBody) {
      return [false, responseBody];
    }

    runInAction(() => {
      if (isExternal) {
        this.hasExternalError = false;
      } else {
        this.hasAPIError = false;
      }
    });
    return [true, responseBody.payload];
  }

  public logout() {
    Cookies.remove('authToken');
    Cookies.remove('isAdmin');

    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }

    this.authToken = null;
    this.isAdmin = false;
    this.isLoggedIn = false;
  }

  @computed
  public get hasNetworkError() {
    return this.hasAPIError || this.hasSocketError || this.hasExternalError;
  }

  @action
  private setupConnection(token: string, isAdmin: boolean) {
    this.authToken = token;
    this.isAdmin = isAdmin;

    this.socket = io(window.location.host, {
      auth: {
        token: this.authToken,
      },
    });

    this.socket.on('connect_error', () => {
      runInAction(() => (this.hasSocketError = true));
    });

    this.socket.on('connect', () => {
      runInAction(() => {
        this.hasSocketError = false;
        this.isLoggedIn = true;
      });
    });

    // this.socket.on('disconnect', () => {
    //   runInAction(() => (this.hasSocketError = true));
    // });
  }

  private handleNetworkError(status: number | undefined, isExternal: boolean) {
    if (!status || status === 503 || status === 504) {
      runInAction(() => {
        if (isExternal) {
          this.hasExternalError = true;
        } else {
          this.hasAPIError = true;
        }
      });
    } else if (status === 403) {
      this.logout();
    }
  }
}
