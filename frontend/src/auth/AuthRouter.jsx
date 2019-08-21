import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { Callback } from './Callback';
import { Logout } from './Logout';
import { LogoutCallback } from './LogoutCallback';
import { SilentRenew } from './SilentRenew';

const AuthRouter = () => (
  <Switch>
    <Route exact={true} path="/auth/signin-oidc" component={Callback} />
    <Route exact={true} path="/auth/logout" component={Logout} />
    <Route exact={true} path="/auth/logout-callback" component={LogoutCallback} />
    <Route exact={true} path="/auth/silentrenew" component={SilentRenew} />
  </Switch>
);

export default AuthRouter;
