import {useAPIStore} from '@sb/lib/stores/root-store';
import {Choose, Otherwise, When} from '@sb/types/control';
import classNames from 'classnames';
import {ProgressSpinner} from 'primereact/progressspinner';
import React, {useEffect} from 'react';

import './error-page.sass';
import {useRouteError} from 'react-router-dom';

interface ErrorPageProps {
  code?: string;
  message?: string;

  isVisible: boolean;
}

const ErrorPage = (props: ErrorPageProps) => {
  const error: Error | null = useRouteError() as Error | null;
  const apiStore = useAPIStore();

  useEffect(() => {
    if (!error) return;
    console.error('[ROUTE] Antimony experienced an unexpected error: ', error);
  }, [error]);

  return (
    <div
      className={classNames('sb-error-page-container', 'sb-animated-overlay', {
        visible: props.isVisible,
      })}
    >
      <span className="sb-error-page-code">
        {props.code ?? 'Unexpected Error'}
      </span>
      <span className="sb-error-page-message">
        {props.message ?? 'Whoops, something broke. Please check the logs.'}
      </span>

      <Choose>
        <When condition={apiStore.hasNetworkError}>
          <div className="sb-error-network-content">
            <div className="sb-error-network-entry">
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
            <div className="sb-error-network-entry">
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
            <div className="sb-error-network-entry">
              <span>External Resources</span>
              <Choose>
                <When condition={apiStore.hasExternalError}>
                  <ProgressSpinner strokeWidth="5" />
                </When>
                <Otherwise>
                  <i className="pi pi-check" />
                </Otherwise>
              </Choose>
            </div>{' '}
          </div>
        </When>
        <When condition={error}>
          <div className="sb-error-stack-content">{error!.stack}</div>
        </When>
      </Choose>
    </div>
  );
};

export default ErrorPage;
