import {useCallback, useEffect, useState} from 'react';

import {FetchState} from '@sb/types/types';
import {APIStore} from '@sb/lib/stores/api-store';

export function useResource<T>(
  path: string,
  apiConnector: APIStore,
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
        setFetchState(FetchState.Error);
      }
    });
  }, [apiConnector, isExternal, mapper, path]);

  useEffect(() => {
    if (fetchState === FetchState.Pending) fetchData();
  }, [fetchState, fetchData]);

  useEffect(() => {
    console.log(path);
    fetchData();
  }, [fetchData, path]);

  return [data, fetchState, fetchData];
}
