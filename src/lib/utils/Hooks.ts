import {useCallback, useEffect, useState} from 'react';

import {FetchState} from '@sb/types/Types';
import {APIConnectorStore} from '@sb/lib/stores/APIConnectorStore';

export type Instantiatable<T> = {new (...args: unknown[]): T};

export function useResource<T>(
  path: string,
  apiConnector: APIConnectorStore,
  defaultValue: T,
  mapper: ((input: unknown) => T) | null = null,
  isExternal = false
): [T, FetchState, () => void] {
  const [data, setData] = useState<T>(defaultValue);
  const [fetchState, setFetchState] = useState<FetchState>(FetchState.Pending);

  const fetchData = useCallback(() => {
    apiConnector.get<T>(path, isExternal).then(data => {
      if (data[0]) {
        setData(mapper ? mapper(data[1] as T) : (data[1] as T));
        setFetchState(FetchState.Done);
      } else {
        setFetchState(FetchState.NetworkError);
      }
    });
  }, [apiConnector, isExternal, mapper, path]);

  useEffect(() => {
    if (fetchState === FetchState.Pending) fetchData();
  }, [fetchState, fetchData]);

  useEffect(() => {
    console.log('fetchingdata');
    fetchData();
  }, [path]);

  return [data, fetchState, fetchData];
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
  }, [singleton, toInstantiate, args]);

  return singleton;
}

export function useReady(...args: (object | null | undefined)[]) {
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    if (!isReady) {
      setReady(args.every(o => o !== null));
    }
  }, [args, isReady]);

  return isReady;
}
