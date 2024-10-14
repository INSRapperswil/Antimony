import {useEffect, useState} from 'react';

import {APIConnector} from '@sb/lib/APIConnector';
import {FetchState} from '@sb/types/Types';

export function useResource<T>(
  path: string,
  apiConnector: APIConnector,
  defaultValue: T,
  isExternal = false
): [T, FetchState] {
  const [data, setData] = useState<T>(defaultValue);
  const [fetchState, setFetchState] = useState<FetchState>(FetchState.Fetching);

  useEffect(() => {
    if (fetchState === FetchState.Fetching) {
      apiConnector.get<T>(path, isExternal).then(data => {
        if (data[0]) {
          setData(data[1] as T);
          setFetchState(FetchState.Done);
        } else {
          setFetchState(FetchState.NetworkError);
        }
      });
    }
  }, []);

  return [data, fetchState];
}
