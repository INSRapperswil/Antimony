import {ErrorResponse, UserCredentials} from '@sb/types/Types';

export class APIConnector {
  private readonly apiUrl = process.env.SB_API_SERVER_URL;

  // TODO(kian): Save in local session storage or cookies
  private authToken: string = '';

  public async login(credentials: UserCredentials): Promise<boolean> {
    const tokenResponse = await this.post<UserCredentials, string>(
      '/login',
      credentials
    );
    if (!tokenResponse[0]) {
      console.error(
        '[AUTH] Failed to login user with provided credentials. Aborting.'
      );
      return false;
    }

    this.authToken = tokenResponse[1] as string;
    return true;
  }

  public async get<T>(path: string): Promise<[boolean, T | ErrorResponse]> {
    try {
      const response = await fetch(`${this.apiUrl}/${path}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: this.authToken,
        },
      });

      if (!response.ok) {
        console.error(
          `[NET] An error occurred while performing GET on ${path}: ${response.status}.`
        );
        return [
          false,
          {
            code: response.status,
            message: `Failed to connect to the requested resource: ${response.status}.`,
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
        `[NET] An error occurred while performing GET ${path}: ${e}`
      );

      return [
        false,
        {
          code: 9999,
          message: `Failed to connect to the requested resource: ${e}`,
        },
      ];
    }
  }

  public async post<T, R>(
    path: string,
    body: T
  ): Promise<[boolean, R | ErrorResponse]> {
    try {
      const response = await fetch(`${this.apiUrl}/${path}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ContentType: 'application/json',
          Authorization: this.authToken,
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
            code: response.status,
            message: `Failed to connect to the requested resource: ${response.status}.`,
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
          code: 9999,
          message: `Failed to connect to the requested resource: ${e}`,
        },
      ];
    }
  }
}
