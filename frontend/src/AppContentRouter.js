import React from 'react';
import {Switch, Route} from 'react-router-dom';
import Home from './Home';
import VersionOne from './VersionOne';
import VersionTwo from './VersionTwo';

const AppContentRouter = () => (
  <Switch>
    <Route exact={true} path='/' component={Home}/>
    <Route exact={true} path='/v1' component={VersionOne}/>
    <Route exact={true} path='/v2' component={VersionTwo}/>
  </Switch>
);

export default AppContentRouter;
