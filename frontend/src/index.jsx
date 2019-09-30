import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import App from './App';
import {AuthProvider} from './auth/AuthProvider';
import {BrowserRouter} from 'react-router-dom';


ReactDOM.render(
  <AuthProvider>
    <BrowserRouter basename={process.env.REACT_APP_UI_ROOT}>
      <App/>
    </BrowserRouter>
  </AuthProvider>,
  document.getElementById('root'));
