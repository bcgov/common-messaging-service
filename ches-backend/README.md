# CHES Backend
CHES (Common Hosted Email Service) Backend is a simple node.js wrapper around the [BC Gov. Common Hosted Email Service](https://github.com/bcgov/common-hosted-email-service.git).  The wrapper is a simple pass through to the service, its main purpose is to hide the service client credentials from the frontend.  

# Configuration
The CHES Backend will require some configuration, namely credentials to CHES and where to call CHES.  

We are using the npm library: [config](https://www.npmjs.com/package/config), to configure our application.  We can either set environment variables to be picked up by [custom-environment-variables.json](./config/custom-environment-variables.json) or we can create a local configuration file (do not check into source control) such as local.json.  Please read the config library documentation to see how it overlays various environment files and uses environment variables to override those values (when provided).

#### Environment Variables

| Name | Default | Description |  
| --- | --- | --- |  
| CHES_CLIENT_ID | MSSC_SERVICE_CLIENT | The name of the service client in the realm that has been granted access to CHES.  See [GetOK](https://github.com/bcgov/nr-get-token.git) for more information |  
| CHES_CLIENT_SECRET | | The service client's password |  
| CHES_TOKEN_URL | | The OpenID token url to authenticate this client |  
| CHES_API_URL | | The CHES url |  
| HOST_URL | http://localhost:8888 | The domain/base url where we will expose the api. |  
| PORT | 8888 | port for node to listen on. |  
| SERVER_LOGLEVEL | info | set the npm log level (verbose, debug, info, warn, error). |  
| SERVER_MORGANFORMAT | dev | set the logging format for Morgan. |   


