import React, {Component} from 'react';
import { Link } from 'react-router-dom';

import './NavigationBar.css';

class NavigationBar extends Component {
  render() {
    return (
      <nav className="navigation-main" id="navbar">
        <div className="container">
          <ul>
            <li><Link to='/'>Home</Link></li>
            <li><Link to='/v1'>Version One</Link></li>
            <li><Link to="/v2">Version Two</Link></li>
          </ul>
        </div>
      </nav>
    );
  }
}

export default NavigationBar;
