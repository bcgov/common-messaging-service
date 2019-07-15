import React from 'react';
import { AuthConsumer } from './AuthProvider';

export const LogoutCallback = () => (
  <AuthConsumer>
    {({ signoutRedirectCallback }) => {
      signoutRedirectCallback();
    }}
  </AuthConsumer>
);
