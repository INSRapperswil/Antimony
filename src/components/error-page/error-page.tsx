import React from 'react';

import './error-page.sass';

interface ErrorPageProps {
  code?: string;
  message?: string;
}

const ErrorPage = (props: ErrorPageProps) => {
  return (
    <div className="sb-error-page-container">
      <span className="sb-error-page-code">{props.code ?? 'Error'}</span>
      <span className="sb-error-page-message">
        {props.message ?? 'Something went wrong. Please check the logs.'}
      </span>
    </div>
  );
};

export default ErrorPage;
