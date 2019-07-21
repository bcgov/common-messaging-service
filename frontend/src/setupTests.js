import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

window._env_ = {
  REACT_APP_OIDC_ISSUER: '',
  REACT_APP_OIDC_CLIENT_ID: '',
  REACT_APP_PUBLIC_URL: ''
};
