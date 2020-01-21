import React,{Component} from 'react';
import {iframeResizer} from 'iframe-resizer';

class Performance extends Component {

  // link to external js script that makes iframe responsive
  componentDidMount() {
    iframeResizer({checkOrigin: false}, '#metabaseDashboard');
  }

  render() {
    return (
      <div className="container" id="maincontainer">
        <div className="row mainrow">
          <div className="col-md-12 mb-3">
            <iframe id="metabaseDashboard" src={window._env_.REACT_APP_CHES_PERFORMANCE_URL} frameBorder="0" width="100%" scrolling="no" allowtransparency=""></iframe>
          </div>
        </div>
      </div>
    );
  }

}

export default Performance;
