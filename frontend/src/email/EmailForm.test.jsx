import React from 'react';
import {shallow} from 'enzyme';
import EmailForm from './EmailForm';

describe('EmailForm test with Enzyme', () => {
  it('renders without crashing', () => {
    shallow(<EmailForm/>);
  });
});
