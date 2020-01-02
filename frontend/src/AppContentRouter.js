import React from 'react';
import {Route, Switch} from 'react-router-dom';
import Home from './Home';
import EmailForm from './email/EmailForm';
import ChesForm from './ches/ChesForm';
import MergeForm from './ches/MergeForm';
import Performance from './ches/Performance';

const AppContentRouter = () => (
  <Switch>
    <Route exact={true} path='/' component={Home}/>
    <Route exact={true} path='/app/cmsg' component={() => <div><EmailForm/></div>}/>
    <Route exact={true} path='/app/ches' component={() => <div><ChesForm/></div>}/>
    <Route exact={true} path='/app/merge' component={() => <div><MergeForm/></div>}/>
    <Route exact={true} path='/app/performance' component={() => <div><Performance/></div>}/>
  </Switch>
);

export default AppContentRouter;
