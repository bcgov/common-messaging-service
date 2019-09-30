import React from 'react';
import {shallow} from 'enzyme';
import TinyMceEditor from './TinyMceEditor';

describe('TinyMceEditor test with Enzyme', () => {
  it('renders without crashing', () => {
    shallow(<TinyMceEditor/>);
  });
});
