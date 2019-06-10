import React, {Component} from 'react';

class Header extends Component {
  render() {
    return (
      <header className="py-5 text-center">
        <img className="d-block mx-auto" src="img/logo.png" alt="BC Gov" height="100px"/>
        <h2>Common Messaging Service Showcase App</h2>
        <p className="lead">This is a simple application, showcasing the Email-sending facility provided by Common Messaging Service. It requires a Service Client that has
          previously been created in the environment with appropriate CMSG scopes.</p>
      </header>
    );
  }
}

export default Header;
