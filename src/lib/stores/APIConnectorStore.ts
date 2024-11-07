import {RootStore} from '@sb/lib/stores/RootStore';
import {AuthResponse, ErrorResponse, UserCredentials} from '@sb/types/Types';
import {makeAutoObservable} from 'mobx';

export class APIConnectorStore {
  private readonly apiUrl = process.env.SB_API_SERVER_URL;
  private rootStore: RootStore;
  private authToken: string | null = null;

  public isAdmin = false;
  public isLoggedIn = false;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
  }

  public async login(credentials: UserCredentials): Promise<boolean> {
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

    this.authToken = (tokenResponse[1] as AuthResponse).token;
    this.isAdmin = (tokenResponse[1] as AuthResponse).isAdmin;
    this.isLoggedIn = true;
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

      return [true, responseBody.payload];
    } catch (e) {
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

      return [true, responseBody.payload];
    } catch (e) {
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
}
