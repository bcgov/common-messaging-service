import React from 'react';
import './App.css';

import AppContentRouter from './AppContentRouter';
import AuthRouter from './auth/AuthRouter';
import Footer from './bcgov/Footer';
import Header from './bcgov/Header';
import NavigationBar from './bcgov/NavigationBar';

const App = () => (
  <app>
    <Header/>
    <NavigationBar />
    <Footer/>
    <div className="app-content">
      <AppContentRouter />
    </div>
    <AuthRouter />
  </app>
);

export default App;
