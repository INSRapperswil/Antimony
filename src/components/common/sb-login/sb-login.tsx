import {ParticlesOptions} from '@sb/components/common/sb-login/particles.conf';
import {useAPIStore, useRootStore} from '@sb/lib/stores/root-store';
import {If} from '@sb/types/control';
import {loadLinksPreset} from '@tsparticles/preset-links';
import Particles, {initParticlesEngine} from '@tsparticles/react';
import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import {Button} from 'primereact/button';
import {Checkbox} from 'primereact/checkbox';
import {InputText} from 'primereact/inputtext';
import {Message} from 'primereact/message';
import {Password} from 'primereact/password';
import React, {ChangeEvent, FormEvent, useEffect, useState} from 'react';

import './sb-login.sass';

const SBLogin = observer(() => {
  const [particlesReady, setParticlesReady] = useState(false);

  // This doesn't render the overlay at all if the user is already logged in
  // const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  const rootStore = useRootStore();
  const apiStore = useAPIStore();

  useEffect(() => {
    void initParticlesEngine(async engine => {
      await loadLinksPreset(engine);
    }).then(() => setParticlesReady(true));

    // setAlreadyLoggedIn(Cookies.get('authToken') !== undefined);
  }, []);

  const LoginForm = () => {
    const [loginError, setLoginError] = useState<string | null>(null);
    const [checkedRemember, setCheckedRemember] = useState(false);

    const [usernameValue, setUsernameValue] = useState<string>('');
    const [passwordValue, setPasswordValue] = useState<string>('');

    function onFormSubmit(event: FormEvent) {
      event.preventDefault();
      const target = event.target as typeof event.target & {
        username: {value: string};
        password: {value: string};
      };

      apiStore
        .login(
          {
            username: target.username.value,
            password: target.password.value,
          },
          checkedRemember
        )
        .then(response => {
          if (!response) {
            setLoginError('Invalid username or password');
          }
        });
    }

    function onUsernameChange(event: ChangeEvent<HTMLInputElement>) {
      setLoginError(null);
      setUsernameValue(event.target.value);
    }

    function onPasswordChange(event: ChangeEvent<HTMLInputElement>) {
      setLoginError(null);
      setPasswordValue(event.target.value);
    }

    return (
      <form onSubmit={onFormSubmit}>
        <div className="sb-login-content">
          <div className="sb-login-content-icon">
            <div className="sb-login-header-icon">
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
              autoComplete="username"
              invalid={loginError !== null}
              value={usernameValue}
              onChange={onUsernameChange}
              name="username"
              placeholder="Username"
            />
          </div>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-lock"></i>
            </span>
            <Password
              autoComplete="current-password"
              invalid={loginError !== null}
              value={passwordValue}
              onChange={onPasswordChange}
              feedback={false}
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
        className={classNames('sb-login-container', 'sb-animated-overlay', {
          visible: !apiStore.isLoggedIn && !apiStore.hasNetworkError,
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

export default SBLogin;
