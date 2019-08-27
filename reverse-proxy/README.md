# The Messaging Service ShowCase (MSSC) Application
The Messaging Service Showcase application is quite simple.  It is a [node.js](https://nodejs.org/) API (see [NR Email Microservice](https://github.com/bcgov/nr-email-microservice)) and a [React.js](https://reactjs.org) UI (see [frontend](../frontend/README.md)).  In production, both the backend and frontend are placed behind a reverse proxy (see [reverse-proxy](./README.md)).


## Reverse Proxy
We stand up a reverse proxy so that we can easily change the urls and paths to our frontend and backend components.  We implement it in [Caddy](https://caddyserver.com), which allows us to use environment variables on deploy to mange ports and paths.  Other options would include [Nginx](https://www.nginx.com) and [Apache Http Server](http://httpd.apache.org).

Internally, we proxy to the OpenShift services for backend and frontend, and we only expose the reverse proxy [service](https://docs.openshift.com/container-platform/3.11/architecture/core_concepts/pods_and_services.html#services) as a [route](https://docs.openshift.com/container-platform/3.11/architecture/networking/routes.html).


### Environment Variables
Configuration of Caddy is done at deploy time through our build pipeline.  Review the [openshift templates](../openshift) to see exactly where the values we use are set.  Our configured (or hardcoded) values are documented here.  See [reverse-proxy.dc.yaml](../openshift/reverse-proxy.dc.yaml), [Jenkinsfile](../Jenkinsfile) or [Jenkinsfile.cicd](../Jenkinsfile.cicd).

* PROXY_SERVICE_PORT - 2015 - the port number that this Caddy is using.
* PATH_ROOT          - /pr-NUM, or /mssc - the path immediate to the domain where we will be served up.
* API_SERVICE_NAME   - mssc-pr-NUM-backend or mssc-master-backend
* API_SERVICE_PORT   - 8080
* UI_SERVICE_NAME    - mssc-pr-NUM-frontend or mssc-master-frontend
* UI_SERVICE_PORT    - 2015

### Running locally

To run and test this locally, you will need to configure and stand up [backend](../ches-backend/README.md) and [frontend](../frontend/README.md).  Set the environment variables the same in 3 different sessions/terminals and stand each component up.


``` sh
# do this in all 3 sessions/terminals
export PROXY_SERVICE_PORT=2020
export PATH_ROOT=/pr-5
export API_SERVICE_NAME=localhost
export API_SERVICE_PORT=8080
export UI_SERVICE_NAME=localhost
export UI_SERVICE_PORT=2021

```

``` sh
# download nr-email-microservice, configure according to their instructions, and go to the /api directory
# set env vars
# assumes that other configuration is done for Oauth urls, CMSG urls and service clients
# ensure that the OIDC configuration is correct and that we use the same config for frontend
export PORT=$API_SERVICE_PORT
npm run start
```

``` sh
cd frontend
# set env vars
export REACT_APP_API_ROOT=$PATH_ROOT
export REACT_APP_UI_ROOT=$PATH_ROOT
export REACT_APP_PUBLIC_URL=http://localhost:$PROXY_SERVICE_PORT$PATH_ROOT
export STATIC_FILES_PATH=./build
# this is for configuring the KeyCloak and OIDC, fill with appropriate values - see above for microservice
export REACT_APP_OIDC_ISSUER=https://sso-dev.pathfinder.gov.bc.ca/auth/realms/98r0z7rz
export REACT_APP_OIDC_CLIENT_ID=mssc-localhost-frontend

npm run build

caddy -quic
```

``` sh
# set env vars
cd reverse-proxy

caddy -quic
```

You may see some file descriptor warnings, but pay no heed.
In your browser, hit http://localhost:2020/pr-5/ and you should see the application working (provided you configured backend correctly).  Hit http://localhost:2021/pr-5/  (where the frontend is hosted) and you should see if fail because it there is no relative api (should see http://localhost:2021/pr-5/api/v1/health 404 (Not Found)).




