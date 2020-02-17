import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Count from './Count';

const Routes = () => (
  <HashRouter>
    <Switch>
      <Route path="/" component={Count} />
      <Route component={<div>404 Not Found</div>} />
    </Switch>
  </HashRouter>
);

export default Routes;
