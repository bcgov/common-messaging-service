import React,{Component} from 'react';


class Performance extends Component {

  render() {

    return (
      <div className="container" id="maincontainer">
        <div id="mainrow" className="row">
          <div className="col-md-12 mb-3">
            <iframe id="metabaseDashboard" src="http://metabase-9f0fbe-prod.pathfinder.gov.bc.ca/public/dashboard/a8fb64fe-ebdd-4489-9ccc-3aafecdaecc9" frameBorder="0" width="100%" scrolling="no" allowtransparency=""></iframe>
          </div> 
        </div>
      </div>
    );
  }

  // link to external js script that makes iframe responsive
  componentDidMount() {
    const script = document.createElement("script");
    script.src = "https://metabase-domo-domo.pathfinder.gov.bc.ca/app/iframeResizer.js";
    script.async = true;
    script.onload = () => this.scriptLoaded();
  
    document.body.appendChild(script);
  }

  // resize performance dashboard iframe
  scriptLoaded() {
    window.iFrameResize({checkOrigin: false}, '#metabaseDashboard');
  }

}


export default Performance;