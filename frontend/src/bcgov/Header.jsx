import React, {Component} from 'react';
import { AuthConsumer } from '../auth/AuthProvider';
import './Header.css';

class Header extends Component {
  constructor(props) {
    super(props);
    this.logoutClick = this.logoutClick.bind(this);
  }
  logoutClick() {
    window.location.href=`${process.env.PUBLIC_URL}/auth/logout`;
  }
  render() {
    return (
      <header>
        <div className="banner">
          <a href="https://gov.bc.ca" alt="British Columbia">
            <img src="./images/logo-banner.svg" alt="Go to the Government of British Columbia website" className="logo-banner" />
          </a>
          <h1>Common Messaging Service Showcase App</h1>
        </div>
        <div className="other">
          <AuthConsumer>
            {({ isAuthenticated, signinRedirect }) => {
              if (isAuthenticated()) {
                return <button onClick={() => { this.logoutClick(); }}>Logout</button>;
              } else {
                return <button onClick={() => { signinRedirect(); }}>Login</button>;
              }
            }}
          </AuthConsumer>
        </div>
      </header>
    );
  }
}

export default Header;
