import React from 'react';

const Home = () => (
  <div className="container" id="maincontainer">
    <div id="mainrow" className="row">
      <div className="col-md-8 offset-md-2 order-md-1">
        <h2>Welcome to Messaging Services Showcase (MSSC).</h2>
        MSSC demonstrates how an application can have messaging functionality by calling an API. In this case, it
        demonstrates how to call two different common messaging APIs: <a
          href="https://github.com/bcgov/nr-messaging-service-showcase/blob/master/docs/developer-guide.md">CMSG</a> and <a
          href="https://github.com/bcgov/common-hosted-email-service">CHES</a>.

        <h4 className="mt-4">Onboarding to Common Services</h4>
        <p>Common Services, such as CMSG and CHES, require an OAuth client. If you are interested in using Common Services, follow the <a href="https://github.com/bcgov/nr-get-token/wiki/onboarding-process">onboarding guide</a> to get an OAuth client for your application.</p>

        <h4 className="mt-4">Demonstrated Capabilities</h4>

        <h5 className="mt-2">Common Messaging Service (CMSG)</h5>
        <ul>
          <li>Send email</li>
          <li>Tracks delivery status information and makes the status information available so that applications can respond to a failed delivery</li>
          <li>Automatically retry when a message notification has failed</li>
        </ul>

        <h5 className="mt-2">Common Hosted Email Service (CHES)</h5>
        <ul>
          <li>Check the health/status of the CHES API</li>
          <li>Send email</li>
          <li>Bulk send email with mail merge templates</li>
          <li>Validate and preview emails from mail merge templates</li>
        </ul>

        <h5 className="mt-2">Messaging Service ShowCase (MSSC)</h5>
        <ul>
          <li>Converts xlsx or csv into a valid JSON format for CHES template endpoints</li>
          <li>Converts email attachments to base64 encoded</li>
          <li>Email form with field validation (for CHES and CMSG)</li>
          <li>Mail merge form with field validation</li>
          <li>HTML editor</li>
          <li>Attachment Dropzone</li>
          <li>Mail merge preview</li>
          <li>Template creation assistance with a list of variables</li>
          <li>Keycloak login and roles</li>
        </ul>
      </div>
    </div>
  </div>
);

export default Home;
