import {ParticlesOptions} from '@sb/components/LoginOverlay/particles.conf';
import {useAPIStore, useRootStore} from '@sb/lib/stores/RootStore';
import {If} from '@sb/types/control';
import {FetchState} from '@sb/types/Types';
import {loadLinksPreset} from '@tsparticles/preset-links';
import Particles, {initParticlesEngine} from '@tsparticles/react';
import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import {Button} from 'primereact/button';
import {Checkbox} from 'primereact/checkbox';
import {InputText} from 'primereact/inputtext';
import {Message} from 'primereact/message';
import React, {FormEvent, useEffect, useState} from 'react';

import './LoginOverlay.sass';

const LoginOverlay = observer(() => {
  const [particlesReady, setParticlesReady] = useState(false);

  const rootStore = useRootStore();
  const apiStore = useAPIStore();

  useEffect(() => {
    void initParticlesEngine(async engine => {
      await loadLinksPreset(engine);
    }).then(() => setParticlesReady(true));
  }, []);

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
    <If condition={particlesReady}>
      <div
        className={classNames('sb-login-page-container', {
          'login-hidden':
            apiStore.isLoggedIn &&
            rootStore.combinedFetchState === FetchState.Done,
        })}
      >
        <If condition={!apiStore.isLoggedIn}>
          <Particles options={ParticlesOptions} />
        </If>
        <LoginForm />
      </div>
    </If>
  );
});

export default LoginOverlay;
