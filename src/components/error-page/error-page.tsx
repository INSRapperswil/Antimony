import classNames from 'classnames';
import React from 'react';

import './error-page.sass';

interface ErrorPageProps {
  code?: string;
  message?: string;

  isVisible: boolean;
}

const ErrorPage = (props: ErrorPageProps) => {
  return (
    <div
      className={classNames('sb-error-page-container', 'sb-animated-overlay', {
        visible: props.isVisible,
      })}
    >
      <span className="sb-error-page-code">{props.code ?? 'Error'}</span>
      <span className="sb-error-page-message">
        {props.message ?? 'Something went wrong. Please check the logs.'}
      </span>
    </div>
  );
};

export default ErrorPage;
