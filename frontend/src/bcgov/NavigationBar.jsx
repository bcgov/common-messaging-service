import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import './NavigationBar.css';

class NavigationBar extends Component {
  render() {
    return (
      <nav className="navigation-main" id="navbar">
        <div className="container">
          <ul>
            <li><Link to='/'>Home</Link></li>
            <li><Link to='/app/cmsg'>CMSG (email v1)</Link></li>
            <li><Link to="/app/ches">CHES (email v2)</Link></li>
            <li><Link to="/app/merge">CHES Mail Merge</Link></li>
            <li><Link to="/app/performance">CHES Performance</Link></li>
          </ul>
        </div>
      </nav>
    );
  }
}

export default NavigationBar;
