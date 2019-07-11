# The Messaging Service ShowCase (MSSC) Application
The Messaging Service Showcase application is quite simple.  It is a [node.js](https://nodejs.org/) API (see [NR Email Microservice](https://github.com/bcgov/nr-email-microservice)) and a [React.js](https://reactjs.org) UI (see [frontend](../frontend/README.md)).  In production, both the backend and frontend are placed behind a reverse proxy (see [reverse-proxy](../reverse-proxy/README.md)).


For both the frontend, we provide a set of npm scripts in [package.json](../frontend/package.json) file; the most important of which is: `npm run build`.  The reverse proxy has no installation scripts (but does have runtime configuration requirements, see [../reverse-proxy](../reverse-proxy/README.md)).

# OpenShift

The showcase application is deployed to OpenShift.  Here you will find documentation about how this application is built and deployed. Since this application is ready for deployment, we will also give some pointers on how to transistion from nothing in OpenShift to having ready-to-go build and deploy configurations. It is assumed that you are familiar with OpenShift commands and resources (ex. buildconfigs, deployconfigs, imagestreams, secrets, configmaps).

Our builds and deployments are performed via Jenkins (see [tools](../tools/README.md)).  And see [Jenkinsfile](../Jenkinsfile) or [Jenkinsfile.cicd](../Jenkinsfile.cicd) to see how the templates are used for building and deploying in our CI/CD pipeline.


### Prepare the namespace/environment

There are some requirements for each namespace/environment, that are **NOT** built and deployed by the CI/CD process.  For this project, we need to ensure each namespace has a secret (credentials to connect to the Common Messaging Service - CMSG), and we need a configmap that we can use to set environment variables.

At a minimum, you will need to have your a Service Client ID and secret, and the OAuth Url for that client/environment (basically who, where, how we authenticate).  The service client id and password will be created through [Get Token](https://github.com/bcgov/nr-get-token).  You will need to get the Common Messaging Service (CMSG) api url and the OAuth url for whichever Common Services environment you are targetting.

Please see [Email Microservice OpenShift Readme](https://github.com/bcgov/nr-email-microservice/openshift/README.md) for more details on secrets, configmap and other configuration details.

#### Secrets/Environment variables
The following oc command creates a new secret, cmsg-client, that will be used to set environment variables in the application.

cmsg-client.username sets enviornment variable CMSG_CLIENT_ID
cmsg-client.password sets enviornment variable CMSG_CLIENT_SECRET

```sh
oc create secret -n <namespace> generic cmsg-client --from-literal=username=<client id> --from-literal=password=<client secret> --type=kubernetes.io/basic-auth
```

#### ConfigMap/Enviornment variables
The following oc command creates a new configmap, cmsg-config, that will be used to set environment variables in the application.  OAUTH\_TOKEN\_URL and CMSG\_TOP\_LEVEL\_URL **must** be set.  These will be available as environment variables matching their name (hence the Uppercase underscore convention for their names).

```sh
oc create configmap -n <namespace> cmsg-config --from-literal=OAUTH_TOKEN_URL=<oauth token url> --from-literal=CMSG_TOP_LEVEL_URL=<common messaging api top level url>
```

## Overview
To deploy the 3 components (backend, frontend, reverse-proxy), into multiple enviroments (one per pull-request, one each for master in dev, test, and prod); we use a series of templates that allows us to configure these deployments.  We do our builds and deploys through Jenkins, and the coordination and configuration of the templates is done in Jenkinsfiles.  See [Jenkinsfile](../Jenkinsfile) and [Jenkinsfile.cicd](../Jenkinsfile.cicd) to see how the templates are used for building and deploying in our CI/CD pipeline.

Since we employ node.js for both the backend and frontend builds, we have used chained builds to help reduce the time to deploy.  That is, we create an image that contains our required npm installs and we only re-build that image if the package.json changes.  Downloading and installing all the npm modules can be time consuming, so we do not want to incur that hit for each deployment.  Once we have our valid npm image, we can use that for our frontend build.

The overall build/deployment process is:
1. Create/Update NPM Images (if needed)
2. "Compile"/Build Frontend production bundle
3. Create Runtime images for Backend, Frontend, Reverse Proxy
4. Deploy Runtime image and service for Backend
5. Deploy Runtime image and service for Frontend
6. Deploy Runtime image, service, and route for Reverse Proxy

## Templates

### Build Template - Backend (Email Microservice)
The backend runtime is [NR Email Microservice](https://github.com/bcgov/nr-email-microservice).  We use their build config and we provide parameters specific for our needs.

We pass the following to the build template:

* SOURCE\_REPO\_REF - this is which tag, or release of the microservice we are building
* APP\_LABEL - we want this to reflect our MSSC app label (ex. mssc-pr-5, mssc-master)
* IMAGE\_NAME - this is the name we use for the objects required for the microservice (ex. mssc-pr-5-backend or mssc-master-backend)

### Build Template - frontend-npm.bc.yaml
This template is used to create our Frontend specific NPM image.  This image will only be created and updated if the [frontend/package.json](../frontend/package.json) changes.  This becomes the "base" image for our Frontend Builder image.  We use an inline Dockerfile to create a fairly slim node.js container with libraries required to build our Frontend static file bundle.

The template expects 5 parameters:

* REPO\_NAME - name of the repository
* JOB\_NAME - this will be master or a pull request (ex. pr-3)
* SOURCE\_REPO\_URL - complete url to the repo (including .git)
* SOURCE\_REPO\_REF - master or pull request ref (ex. pull/3/head)
* APP\_NAME - name of the application: mssc

### Build Template - frontend-builder.bc.yaml
This template is used to create our Frontend Builder image, it is 2nd in the Frontend chained build and is based on frontend-npm.bc.yaml.  This image will only be created and updated if the [frontend/*](../frontend) code changes - basically if we update any Frontend code.  This will call our frontend "npm run build" script and produce a minified React production bundle.  In order to have this bundle configured correctly, we need to tell it the relative path to our backend.  This is done with and parameter named PATH\_ROOT that will subsequently be used to configure an environment variable: REACT\_APP\_PATH\_ROOT that is compiled into the application.

The template expects 7 parameters:

* REPO\_NAME - name of the repository
* JOB\_NAME - this will be master or a pull request (ex. pr-3)
* SOURCE\_REPO\_URL - complete url to the repo (including .git)
* SOURCE\_REPO\_REF - master or pull request ref (ex. pull/3/head)
* APP\_NAME - name of the application: mssc
* NAMESPACE - the Openshift namespace where we can source our Frontend NPM image (ex. z208i4-tools)
* PATH\_ROOT - compiled into our React code, the path were we will be hosting the backend and frontend (ex. /pr-3 or /mssc)

### Build Template - frontend.bc.yaml
This template is used to create our Frontend Runtime image, it is 3rd in the Frontend chained build and uses frontend-builder.bc.yaml.  This image will only be created and updated if the [frontend/*](../frontend) code changes - basically if we update any Frontend code.  The minified React production bundle is copied into a new image that is a Caddy server, which serves that static file.

The template expects 6 parameters:

* REPO\_NAME - name of the repository
* JOB\_NAME - this will be master or a pull request (ex. pr-3)
* SOURCE\_REPO\_URL - complete url to the repo (including .git)
* SOURCE\_REPO\_REF - master or pull request ref (ex. pull/3/head)
* APP\_NAME - name of the application: mssc
* NAMESPACE - the Openshift namespace where we can source our Frontend Builder image (ex. z208i4-tools)

### Build Template - reverse-proxy.bc.yaml
This template is used to create our Reverse Proxy Runtime image.  Our source (a Caddyfile) is copied into a BcGov Caddy base image.

The template expects 5 parameters:

* REPO\_NAME - name of the repository
* JOB\_NAME - this will be master or a pull request (ex. pr-3)
* SOURCE\_REPO\_URL - complete url to the repo (including .git)
* SOURCE\_REPO\_REF - master or pull request ref (ex. pull/3/head)
* APP\_NAME - name of the application: mssc

### Deploy Template - Backend (Email Microservice)
This template deploys our Backend Runtime image (nodejs server) and creates a service for it.  This service is internal and used by the Reverse Proxy to handle backend requests.

We provide the following parameters to the deployment config:

* APP\_LABEL - we want this to reflect our MSSC app label (ex. mssc-pr-5, mssc-master)
* IMAGE\_NAME - this is the name we use for the objects required for the microservice (ex. mssc-pr-5-backend or mssc-master-backend)
* NAMESPACE - the Openshift namespace to which these objects are deployed (ex. z208i4-dev)
* SECRET_NAME - this is the name of our secrets for CMSG Service Client: cmsg-client
* CONFIG_MAP_NAME - this is the name of our config map for CMSG Service Client Urls: cmsg-config
* CMSG_SENDER - the email address we use as our default sender. NR.CommonServiceShowcase@gov.bc.ca
* HOST_URL - this is the full url that will be exposed by our reverse proxy.  (ex. https://${HOST\_ROUTE}${PATH\_ROOT}"


### Deploy Template - frontend.dc.yaml
This template deploys our Frontend Runtime image (Caddy static files server) and creates a service for it.  This service is internal and used by the Reverse Proxy to handle frontend requests.

The template expects 5 parameters:

* REPO\_NAME - name of the repository
* JOB\_NAME - this will be master or a pull request (ex. pr-3)
* APP\_NAME - name of the application: mssc
* NAMESPACE - the Openshift namespace to which these objects are deployed (ex. z208i4-dev)
* PATH\_ROOT - Same as we used to build the React code, the path were we will be hosting the backend and frontend (ex. /pr-3 or /mssc)

### Deploy Template - reverse-proxy.dc.yaml
This template deploys our Reverse Proxy Runtime image (Caddy reverse proxy server), creates a service for it and exposes a route (publicly accessible Url).

The template expects 6 parameters:

* REPO\_NAME - name of the repository
* JOB\_NAME - this will be master or a pull request (ex. pr-3)
* APP\_NAME - name of the application: mssc
* HOST\_ROUTE - domain for this instance (ex. z208i4-dev.pathfinder.gov.bc.ca)
* PATH\_ROOT - Same as we used to build the React code, the path were we will be hosting the backend and frontend (ex. /pr-3 or /mssc)

HOST\_ROUTE and PATH\_ROOT are combined to make the Url.

#### Notes
The deployment templates also accept parameters for resource limits and requests, so they can be adjusted per environment/deployment.


#### Examples
Please see [Email Microservice OpenShift Readme](https://github.com/bcgov/nr-email-microservice/blob/master/openshift/README.md) for examples on how one would call openshift templates and provide parameters on the command line.

``` sh
cd openshift

export proj=<project namespace>

export REPO_NAME=nr-email-microservice
export JOB_NAME=pr-x
export SOURCE_REPO_URL=https://github.com/bcgov/nr-email-microservice.git
export SOURCE_REPO_REF=feature/oidc
export APP_NAME=mssc
export NAMESPACE=$proj
export PATH_ROOT=/pr-x
export HOST_URL=https://$APP_NAME-dev.pathfinder.gov.bc.ca$PATH_ROOT


oc -n $proj process -f frontend-npm.bc.yaml -p REPO_NAME=$REPO_NAME -p JOB_NAME=$JOB_NAME -p SOURCE_REPO_URL=$SOURCE_REPO_URL -p SOURCE_REPO_REF=$SOURCE_REPO_REF -p APP_NAME=$APP_NAME -o yaml | oc -n $proj create -f -

imagestream.image.openshift.io/mssc-pr-x-frontend-npm created
buildconfig.build.openshift.io/mssc-pr-x-frontend-npm created

oc -n $proj start-build mssc-pr-x-frontend-npm

build.build.openshift.io/mssc-pr-x-frontend-npm-1 started

oc logs build/mssc-pr-x-frontend-npm-1 --follow


oc -n $proj process -f frontend-builder.bc.yaml -p REPO_NAME=$REPO_NAME -p JOB_NAME=$JOB_NAME -p SOURCE_REPO_URL=$SOURCE_REPO_URL -p SOURCE_REPO_REF=$SOURCE_REPO_REF -p APP_NAME=$APP_NAME -p PATH_ROOT=$PATH_ROOT -p NAMESPACE=$NAMESPACE -o yaml | oc -n $proj create -f -

imagestream.image.openshift.io/mssc-pr-x-frontend-builder created
buildconfig.build.openshift.io/mssc-pr-x-frontend-builder created

oc -n $proj start-build mssc-pr-x-frontend-builder

build.build.openshift.io/mssc-pr-x-frontend-builder-1 started

oc logs build/mssc-pr-x-frontend-builder-1 --follow

oc -n $proj process -f frontend.bc.yaml -p REPO_NAME=$REPO_NAME -p JOB_NAME=$JOB_NAME -p SOURCE_REPO_URL=$SOURCE_REPO_URL -p SOURCE_REPO_REF=$SOURCE_REPO_REF -p APP_NAME=$APP_NAME -p NAMESPACE=$NAMESPACE -o yaml | oc -n $proj create -f -

imagestream.image.openshift.io/mssc-pr-x-frontend created
buildconfig.build.openshift.io/mssc-pr-x-frontend created

oc -n $proj start-build mssc-pr-x-frontend

build.build.openshift.io/mssc-pr-x-frontend-1 started

oc logs build/mssc-pr-x-frontend-1 --follow

oc -n $proj process -f frontend.dc.yaml -p REPO_NAME=$REPO_NAME -p JOB_NAME=$JOB_NAME -p APP_NAME=$APP_NAME -p NAMESPACE=$NAMESPACE -p PATH_ROOT=$PATH_ROOT -p PUBLIC_URL=$HOST_URL -o yaml | oc -n $proj create -f -



oc -n $proj  delete all,template,secret,configmap,pvc,serviceaccount,rolebinding --selector app=$APP_NAME-$JOB_NAME

```
