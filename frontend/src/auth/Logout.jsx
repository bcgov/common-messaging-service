import * as React from 'react';
import { AuthConsumer } from './AuthProvider';

export const Logout = () => (
  <AuthConsumer>
    {({ logout }) => {
      logout();
    }}
  </AuthConsumer>
);
