import {RootStore} from '@sb/lib/stores/root-store';
import {AuthResponse, ErrorResponse, UserCredentials} from '@sb/types/types';
import {action, makeAutoObservable, runInAction} from 'mobx';
import Cookies from 'js-cookie';
import {io, Socket} from 'socket.io-client';

export class APIStore {
  private readonly apiUrl = process.env.SB_API_SERVER_URL;
  private rootStore: RootStore;
  private authToken: string | null = null;

  public isAdmin = false;
  public isLoggedIn = false;
  public hasNetworkError = false;

  public socket: Socket = io();

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;

    if (Cookies.get('authToken') !== undefined) {
      this.setToken(
        Cookies.get('authToken')!,
        Boolean(Cookies.get('isAdmin')) ?? false
      );
    }
  }

  @action
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
    this.setToken(authResponse.token, authResponse.isAdmin);
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
  ): Promise<[boolean, T | ErrorResponse]> {
    if (!skipAuthentication && !isExternal && this.authToken === null) {
      return [false, {code: '-1', message: 'Unauthorized'}];
    }

    try {
      let response: Response | null = null;

      if (isExternal) {
        response = await fetch(path, {method: 'GET'});
      } else {
        response = await fetch(this.apiUrl + path, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.authToken}`,
          },
        });
      }

      if (!response.ok) {
        // Logout and remove token if token was invalid
        if (!skipAuthentication && response.status === 403) this.logout();

        if (response.status === 504) {
          runInAction(() => (this.hasNetworkError = true));
        }

        console.error(
          `[NET] An error occurred while performing GET on ${path}: ${response.status}.`
        );
        return [
          false,
          {
            code: String(response.status),
            message: await response.text(),
          },
        ];
      }

      if (isExternal) {
        return [true, JSON.parse(await response.text())];
      }

      const responseBody = await response.json();

      if ('code' in responseBody) {
        return [false, responseBody];
      }

      runInAction(() => (this.hasNetworkError = false));
      return [true, responseBody.payload];
    } catch (e) {
      runInAction(() => (this.hasNetworkError = true));

      console.error(
        `[NET] An error occurred while performing GET ${path}: ${e}`
      );

      return [
        false,
        {
          code: 'NETERR',
          message: `Failed to connect to the requested resource: ${e}`,
        },
      ];
    }
  }

  public async post<T, R>(
    path: string,
    body: T,
    isExternal = false,
    skipAuthentication = false
  ): Promise<[boolean, R | ErrorResponse]> {
    if (!skipAuthentication && this.authToken === null) {
      return [false, {code: '-1', message: 'Unauthorized'}];
    }

    try {
      const url = isExternal ? path : this.apiUrl + path;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Logout and remove token if token was invalid
        if (!skipAuthentication && response.status === 403) this.logout();

        if (response.status === 504) {
          runInAction(() => (this.hasNetworkError = true));
        }

        console.error(
          `[NET] An error occurred while performing POST on ${path}: ${response.status}.`
        );
        return [
          false,
          {
            code: String(response.status),
            message: await response.text(),
          },
        ];
      }

      const responseBody = await response.json();

      if ('code' in responseBody) {
        return [false, responseBody];
      }

      runInAction(() => (this.hasNetworkError = false));
      return [true, responseBody.payload];
    } catch (e) {
      runInAction(() => (this.hasNetworkError = true));

      console.error(
        `[NET] An error occurred while performing POST on ${path}: ${e}`
      );

      return [
        false,
        {
          code: 'NETERR',
          message: `Failed to connect to the requested resource: ${e}`,
        },
      ];
    }
  }

  public logout() {
    this.authToken = null;
    this.isAdmin = false;
    this.isLoggedIn = false;
    Cookies.remove('authToken');
    Cookies.remove('isAdmin');

    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  private setToken(token: string, isAdmin: boolean) {
    this.authToken = token;
    this.isAdmin = isAdmin;
    this.isLoggedIn = true;

    this.socket = io('ws://localhost:8100/api', {
      auth: {
        token: this.authToken,
      },
    });
  }
}
