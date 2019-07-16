import React from 'react';
import Header from './bcgov/Header';
import Footer from './bcgov/Footer';
import EmailForm from './email/EmailForm';

import { Route, Switch, BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './auth/AuthProvider';
import { Callback } from './auth/Callback';
import { Logout } from './auth/Logout';
import { LogoutCallback } from './auth/LogoutCallback';
import { SilentRenew } from './auth/SilentRenew';

const App = () => (
  <AuthProvider>
    <BrowserRouter basename={process.env.REACT_APP_UI_ROOT}>
      <Switch>
        <Route exact={true} path="/auth/signin-oidc" component={Callback} />
        <Route exact={true} path="/auth/logout" component={Logout} />
        <Route exact={true} path="/auth/logout-callback" component={LogoutCallback} />
        <Route exact={true} path="/auth/silentrenew" component={SilentRenew} />
      </Switch>
    </BrowserRouter>
    <Header/>
    <EmailForm />
    <Footer/>
  </AuthProvider>
);

export default App;
