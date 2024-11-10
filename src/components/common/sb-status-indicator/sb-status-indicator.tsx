import ErrorPage from '@sb/components/error-page/error-page';

import {useAPIStore, useRootStore} from '@sb/lib/stores/root-store';
import {Choose, Otherwise, When} from '@sb/types/control';
import {FetchState} from '@sb/types/types';
import classNames from 'classnames';

import {observer} from 'mobx-react-lite';
import {ProgressSpinner} from 'primereact/progressspinner';
import React, {useEffect, useState} from 'react';

import {DNA} from 'react-loader-spinner';
import './sb-status-indicator.sass';

interface SBStatusIndicatorProps {
  setDoneLoading: () => void;
}

const SBStatusIndicator = observer((props: SBStatusIndicatorProps) => {
  const apiStore = useAPIStore();
  const rootStore = useRootStore();

  const [loaderVisible, setLoaderVisible] = useState(false);

  const errorPanelVisible = apiStore.hasNetworkError && apiStore.isLoggedIn;
  const errorOverlayVisible = apiStore.hasNetworkError && !apiStore.isLoggedIn;

  useEffect(() => {
    const isDone = rootStore.combinedFetchState === FetchState.Done;
    if (apiStore.isLoggedIn && !isDone && !loaderVisible) {
      setLoaderVisible(true);
    } else if (apiStore.isLoggedIn && isDone && loaderVisible) {
      setTimeout(() => {
        setLoaderVisible(false);
        props.setDoneLoading();
      }, 0);
    }
  }, [
    apiStore.hasNetworkError,
    apiStore.isLoggedIn,
    loaderVisible,
    props,
    rootStore.combinedFetchState,
  ]);

  return (
    <>
      <ErrorPage
        code="Network Error"
        message="Antimony was unable to reach some network resources."
        isVisible={errorOverlayVisible}
      />
      <div
        className={classNames('sb-indicator-container', 'sb-animated-overlay', {
          visible: loaderVisible,
        })}
      >
        <div className="sb-indicator-loader-panel">
          <span className="sb-indicator-loader-panel-title">
            Antimony Loading
          </span>
          <DNA />
        </div>
      </div>
      <div
        className={classNames('sb-animated-overlay', {
          visible: errorPanelVisible,
        })}
      >
        <div className="sb-indicator-error-panel">
          <div className="sb-indicator-error-header">
            <i className="pi pi-globe" />
            <i className="pi pi-times-circle sb-indicator-error-icon-overlay" />
            <span>Antimony is experiencing network issues</span>
          </div>
          <div className="sb-indicator-error-content">
            <div className="sb-indicator-error-entry">
              <span>Antimony API</span>
              <Choose>
                <When condition={apiStore.hasAPIError}>
                  <ProgressSpinner strokeWidth="5" />
                </When>
                <Otherwise>
                  <i className="pi pi-check" />
                </Otherwise>
              </Choose>
            </div>
            <div className="sb-indicator-error-entry">
              <span>Antimony Socket</span>
              <Choose>
                <When condition={apiStore.hasSocketError}>
                  <ProgressSpinner strokeWidth="5" />
                </When>
                <Otherwise>
                  <i className="pi pi-check" />
                </Otherwise>
              </Choose>
            </div>
            <div className="sb-indicator-error-entry">
              <span>External Resources</span>
              <Choose>
                <When condition={apiStore.hasExternalError}>
                  <ProgressSpinner strokeWidth="5" />
                </When>
                <Otherwise>
                  <i className="pi pi-check" />
                </Otherwise>
              </Choose>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default SBStatusIndicator;
