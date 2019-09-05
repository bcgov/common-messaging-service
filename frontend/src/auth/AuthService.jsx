/*eslint-disable */
import { IDENTITY_CONFIG, METADATA_OIDC } from './AuthConfig';
import { UserManager, WebStorageStateStore, Log } from 'oidc-client';

export default class AuthService {
  UserManager;
  accessToken;

  constructor() {
    this.UserManager = new UserManager({
      ...IDENTITY_CONFIG,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      ...METADATA_OIDC
    });
    // Logger
    Log.logger = console;
    Log.level = Log.DEBUG;

    this.UserManager.events.addUserLoaded(user => {
      this.accessToken = user.access_token;
      localStorage.setItem('access_token', user.access_token);
      localStorage.setItem('id_token', user.id_token);

      this.setUserInfo({
        accessToken: this.accessToken,
        idToken: user.id_token
      });

      if (window.location.href.indexOf('signin-oidc') !== -1) {
        this.navigateToScreen();
      }

    });

    this.UserManager.events.addSilentRenewError(e => {
      console.log('silent renew error', e.message);
    });

    this.UserManager.events.addAccessTokenExpired(() => {
      console.log('token expired');
      this.signinSilent();
    });
  }

  signinRedirectCallback = () => {
    this.UserManager.signinRedirectCallback()
      .then(() => {
        console.log('signin redirect callback executed');
      })
      .catch(err => {
        console.log(err);
      });
  };

  getUser = async () => {
    const user = await this.UserManager.getUser();
    if (!user) {
      return await this.UserManager.signinRedirectCallback();
    }
    return user;
  };

  parseJwt = token => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
  };

  setUserInfo = authResult => {
    const data = this.parseJwt(this.accessToken);
    // we can examine data for roles here...
    this.setSessionInfo(authResult);
    this.setUser(data);
  };

  signinRedirect = () => {
    localStorage.setItem('redirectUri', window.location.pathname);
    this.UserManager.signinRedirect({});
  };

  setUser = data => {
    localStorage.setItem('userId', data.sub);
  };

  navigateToScreen = () => {
    const redirectUri = localStorage.getItem("redirectUri") ? localStorage.getItem('redirectUri') : `${window._env_.REACT_APP_PUBLIC_URL}`;

    window.location.replace(redirectUri);
  };

  setSessionInfo(authResult) {
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
  }

  isAuthenticated = () => {
    const access_token = localStorage.getItem('access_token');
    return !!access_token;
  };

  signinSilent = () => {
    this.UserManager.signinSilent()
      .then(user => {
        console.log('signed in', user);
      })
      .catch(err => {
        console.log(err);
      });
  };

  signinSilentCallback = () => {
    this.UserManager.signinSilentCallback();
  };

  createSigninRequest = () => {
    return this.UserManager.createSigninRequest();
  };

  logout = () => {
    this.UserManager.signoutRedirect({
      id_token_hint: localStorage.getItem('id_token')
    });
    this.UserManager.clearStaleState();
  };

  signoutRedirectCallback = () => {
    this.UserManager.signoutRedirectCallback().then(() => {
      localStorage.clear();
      window.location.replace(`${window._env_.REACT_APP_PUBLIC_URL}`);
    });
    this.UserManager.clearStaleState();
  };

  hasRole = (user, role) => {
    if (user) {
      const content = this.parseJwt(user.access_token);
      const defaultClientId = `${window._env_.REACT_APP_OIDC_CLIENT_ID}`

      const parts = role.split(':');

      if (parts.length === 1) {
        return this.hasApplicationRole(content, defaultClientId, parts[0]);
      }

      if (parts[0] === 'realm') {
        return this.hasRealmRole(content, parts[1]);
      }

      return this.hasApplicationRole(content, parts[0], parts[1]);
    }
    return false;
  };

  hasRealmRole = (content, roleName) => {
    // Make sure we have these properties before we check for a certain realm level role!
    // Without this we attempt to access an undefined property on token
    // for a user with no realm level roles.
    if (!content.realm_access || !content.realm_access.roles) {
      return false;
    }

    return (content.realm_access.roles.indexOf(roleName) >= 0);
  };

  hasApplicationRole = (content, appName, roleName) => {
    let appRoles = content.resource_access[appName];
    if (!appRoles) {
      return false;
    }
    return (appRoles.roles.indexOf(roleName) >= 0);
  };

}
