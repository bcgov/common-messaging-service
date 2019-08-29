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
            <li><Link to='/v1'>CMSG (email v1)</Link></li>
            <li><Link to="/v2">CHES (email v2)</Link></li>
          </ul>
        </div>
      </nav>
    );
  }
}

export default NavigationBar;
