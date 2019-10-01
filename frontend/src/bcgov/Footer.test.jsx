import React from 'react';
import {shallow} from 'enzyme';
import Footer from './Footer';

describe('Footer test with Enzyme', () => {
  it('renders without crashing', () => {
    shallow(<Footer/>);
  });
});
