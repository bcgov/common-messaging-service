import React from 'react';
import {Switch, Route} from 'react-router-dom';
import Home from './Home';
import EmailForm from './email/EmailForm';
import ChesForm from './ches/ChesForm';
import MergeForm from './ches/MergeForm';

const AppContentRouter = () => (
  <Switch>
    <Route exact={true} path='/' component={Home}/>
    <Route exact={true} path='/app/cmsg' component={ () => <div> <EmailForm /> </div> }/>
    <Route exact={true} path='/app/ches' component={ () => <div> <ChesForm /> </div> }/>
    <Route exact={true} path='/app/merge' component={ () => <div> <MergeForm /> </div> }/>
  </Switch>
);

export default AppContentRouter;
