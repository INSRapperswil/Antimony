import React from 'react';
import {Navigate, useLocation, useSearchParams} from 'react-router-dom';

const LoginRedirect = () => {
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  // useEffect(() => {
  //   setSearchParams({redirect: location.pathname});
  // }, [location, setSearchParams]);

  return <Navigate to="/login"></Navigate>;
};

export default LoginRedirect;
