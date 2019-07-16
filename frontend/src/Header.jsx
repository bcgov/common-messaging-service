import React, {Component} from 'react';
import { AuthConsumer } from './auth/AuthProvider';

class Header extends Component {
  render() {
    return (
      <header className="py-5 text-center">
        <img className="d-block mx-auto" src="img/logo.png" alt="BC Gov" height="100px"/>
        <h2>Common Messaging Service Showcase App</h2>
        <p className="lead">This is a simple Email-sending showcase app.<br />It requires a Service Client that has
          previously been created in the environment with appropriate CMSG scopes.</p>
        <AuthConsumer>
          {({ isAuthenticated, signinRedirect }) => {
            if (isAuthenticated()) {
              return <a href="/auth/logout">Logout</a>;
            } else {
              return <button onClick={() => { signinRedirect(); }} value="Login" />;
            }
          }}
        </AuthConsumer>
      </header>
    );
  }
}

export default Header;
