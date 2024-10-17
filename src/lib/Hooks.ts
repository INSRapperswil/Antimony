import {useEffect, useState} from 'react';

import {APIConnector} from '@sb/lib/APIConnector';
import {FetchState} from '@sb/types/Types';

export type Instantiatable<T> = {new (...args: unknown[]): T};

export function useResource<T>(
  path: string,
  apiConnector: APIConnector,
  defaultValue: T,
  mapper: ((input: unknown) => T) | null = null,
  isExternal = false
): [T, FetchState] {
  const [data, setData] = useState<T>(defaultValue);
  const [fetchState, setFetchState] = useState<FetchState>(FetchState.Fetching);

  useEffect(() => {
    if (fetchState === FetchState.Fetching) {
      apiConnector.get<T>(path, isExternal).then(data => {
        if (data[0]) {
          setData(mapper ? mapper(data[1] as T) : (data[1] as T));
          setFetchState(FetchState.Done);
        } else {
          setFetchState(FetchState.NetworkError);
        }
      });
    }
  }, []);

  return [data, fetchState];
}

export function useSingleton<T>(
  toInstantiate: Instantiatable<T>,
  ...args: unknown[]
) {
  const [singleton, setSingleton] = useState<T | null>(null);

  useEffect(() => {
    if (!singleton) {
      setSingleton(new toInstantiate(...args));
    }
  });

  return singleton;
}

export function useReady(...args: (object | null | undefined)[]) {
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    if (!isReady) {
      setReady(args.every(o => o !== null));
    }
  });

  return isReady;
}
