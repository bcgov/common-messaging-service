import React from 'react';

import {AuthConsumer} from './AuthProvider';

export const SilentRenew = () => (
  <AuthConsumer>
    {({signinSilentCallback}) => {
      signinSilentCallback();
    }}
  </AuthConsumer>
);
