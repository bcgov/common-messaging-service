import React from 'react';
import Header from './Header';
import Footer from './Footer';
import EmailForm from './email/EmailForm';

const App = () => (
  <div className="container">
    <Header/>
    <div className="row">
      <EmailForm/>
    </div>
    <Footer/>
  </div>
);

export default App;
