import {RootStoreContext} from '@sb/lib/stores/RootStore';
import {If} from '@sb/types/control';
import classNames from 'classnames';
import {Message} from 'primereact/message';
import {useNavigate} from 'react-router-dom';
import {ParticlesOptions} from './particles.conf';
import {loadLinksPreset} from '@tsparticles/preset-links';
import {Button} from 'primereact/button';
import {Checkbox} from 'primereact/checkbox';
import {InputText} from 'primereact/inputtext';
import React, {FormEvent, useContext, useEffect, useState} from 'react';
import Particles, {initParticlesEngine} from '@tsparticles/react';

import './LoginPage.sass';

interface LoginPageProps {
  code?: string;
  message?: string;
}

const LoginPage = (props: LoginPageProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    void initParticlesEngine(async engine => {
      await loadLinksPreset(engine);
    });
  }, []);

  const apiStore = useContext(RootStoreContext).apiConnectorStore;

  const LoginForm = () => {
    const [loginError, setLoginError] = useState<string | null>(null);
    const [checkedRemember, setCheckedRemember] = useState(false);

    function onFormSubmit(event: FormEvent) {
      event.preventDefault();
      const target = event.target as typeof event.target & {
        username: {value: string};
        password: {value: string};
      };

      apiStore
        .login({
          username: target.username.value,
          password: target.password.value,
        })
        .then(response => {
          if (!response) {
            setLoginError('Invalid username or password');
          } else {
            navigate('/');
          }
        });
    }

    function onInputChange() {
      setLoginError(null);
    }

    return (
      <form onSubmit={onFormSubmit}>
        <div className="sb-login-page-content">
          <div className="sb-login-page-content-header">
            <div className="sb-login-page-header-icon">
              <i className="pi pi-user"></i>
            </div>
          </div>
          <If condition={loginError}>
            <Message severity="error" text={loginError} />
          </If>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-user"></i>
            </span>
            <InputText
              className={classNames({
                error: loginError !== null,
              })}
              onChange={onInputChange}
              name="username"
              placeholder="Username"
            />
          </div>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-lock"></i>
            </span>
            <InputText
              className={classNames({
                error: loginError !== null,
              })}
              onChange={onInputChange}
              name="password"
              placeholder="Password"
            />
          </div>
          <div className="sb-login-remember">
            <Checkbox
              checked={checkedRemember}
              onChange={e => setCheckedRemember(e.checked ?? false)}
            />
            <span>Remember me</span>
          </div>

          <Button label="LOGIN" type="submit" />

          <div className="sb-login-content-header">
            <span>SIGN IN</span>
          </div>
        </div>
      </form>
    );
  };

  /*
   * Unfortunately we need to separate the login form from the particles to
   * prevent restarting the simulation every time.
   * https://github.com/Wufe/react-particles-js/issues/43
   */
  return (
    <div className="sb-login-page-container">
      <Particles id="tsparticles" options={ParticlesOptions} />
      <LoginForm />
    </div>
  );
};

export default LoginPage;
